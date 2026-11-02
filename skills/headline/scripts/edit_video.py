#!/usr/bin/env python3
"""Put a rendered style clip into the user's own video with ffmpeg.

Modes
  insert  (default)  cut to the clip at --at seconds; the user's video resumes after it.
                     The user's audio keeps playing underneath the whole time.
  prepend            clip first, then the user's video.
  append             user's video, then the clip.
  pip                clip shown as a rounded card in the top half over the user's video
                     from --at for the clip's length (speaker stays visible below).

Usage
  python3 edit_video.py USER_VIDEO CLIP OUT.mp4 [--mode insert] [--at 3.5]
"""
import argparse, json, subprocess, sys


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "stream=codec_type,width,height:format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    has_audio = any(s["codec_type"] == "audio" for s in j["streams"])
    return int(v["width"]), int(v["height"]), float(j["format"]["duration"]), has_audio


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("clip"); ap.add_argument("out")
    ap.add_argument("--mode", default="insert", choices=["insert", "prepend", "append", "pip"])
    ap.add_argument("--at", type=float, default=0.0, help="seconds into the user's video")
    a = ap.parse_args()

    W, H, vdur, v_audio = probe(a.video)
    W -= W % 2; H -= H % 2
    _, _, cdur, c_audio = probe(a.clip)
    fit = (f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
           f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30,format=yuv420p")
    src = f"scale={W}:{H},setsar=1,fps=30,format=yuv420p"
    at = max(0.0, min(a.at, vdur))

    if a.mode == "insert":
        d = min(cdur, vdur - at)
        if d <= 0.05:
            sys.exit("--at is past the end of the video")
        segs, parts = [], []
        if at >= 0.04:
            segs.append(f"[0:v]trim=0:{at},setpts=PTS-STARTPTS,{src}[a]"); parts.append("[a]")
        segs.append(f"[1:v]trim=0:{d},setpts=PTS-STARTPTS,{fit}[b]"); parts.append("[b]")
        if at + d < vdur - 0.04:
            segs.append(f"[0:v]trim=start={at + d},setpts=PTS-STARTPTS,{src}[c]"); parts.append("[c]")
        f = ";".join(segs) + ";" + "".join(parts) + f"concat=n={len(parts)}:v=1:a=0[v]"
        amap = ["-map", "0:a"] if v_audio else []
    elif a.mode in ("prepend", "append"):
        first, second = ("[1:v]", "[0:v]") if a.mode == "prepend" else ("[0:v]", "[1:v]")
        fa = fit if first == "[1:v]" else src
        fb = fit if second == "[1:v]" else src
        f = f"{first}{fa}[x];{second}{fb}[y];[x][y]concat=n=2:v=1:a=0[v]"
        amap = []
        if v_audio:
            # user's audio placed where their footage plays; silence over the clip
            delay = int(cdur * 1000) if a.mode == "prepend" else 0
            total = vdur + cdur
            f += (f";[0:a]atrim=0:{vdur},asetpts=PTS-STARTPTS,"
                  f"adelay={delay}:all=1,apad=whole_dur={total},atrim=0:{total}[aud]")
            amap = ["-map", "[aud]"]
    else:  # pip
        cw = int(W * 0.86) // 2 * 2
        ch = int(cw * 16 / 9) // 2 * 2
        ch = min(ch, int(H * 0.55) // 2 * 2)
        cw = int(ch * 9 / 16) // 2 * 2
        r = max(12, cw // 22)
        f = (f"[0:v]{src}[base];"
             f"[1:v]scale={cw}:{ch}:force_original_aspect_ratio=increase,crop={cw}:{ch},"
             f"format=yuva420p,geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':"
             f"a='if(lte(hypot(max(0,abs(X-{cw}/2)-({cw}/2-{r})),max(0,abs(Y-{ch}/2)-({ch}/2-{r}))),{r}),255,0)',"
             f"setpts=PTS-STARTPTS+{at}/TB[card];"
             f"[base][card]overlay=(W-w)/2:H*0.06:enable='between(t,{at},{at + cdur})':eof_action=pass[v]")
        amap = ["-map", "0:a"] if v_audio else []

    cmd = ["ffmpeg", "-v", "error", "-y", "-i", a.video, "-i", a.clip,
           "-filter_complex", f, "-map", "[v]", *amap,
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", a.out]
    subprocess.run(cmd, check=True)
    print("DONE", a.out)


if __name__ == "__main__":
    main()
