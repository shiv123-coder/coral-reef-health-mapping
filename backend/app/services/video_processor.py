"""Video frame extraction service."""

import cv2
from pathlib import Path
from typing import List


def extract_frames(
    video_path: str,
    output_dir: str,
    max_frames: int = 30,
    interval_sec: float = 1.0,
) -> List[str]:
    """
    Extract frames from video at regular intervals.
    Returns list of saved frame paths.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frame_interval = max(int(fps * interval_sec), 1)

    frame_paths = []
    frame_idx = 0
    saved = 0

    while cap.isOpened() and saved < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % frame_interval == 0:
            path = out / f"frame_{saved:04d}.jpg"
            cv2.imwrite(str(path), frame)
            frame_paths.append(str(path))
            saved += 1
        frame_idx += 1

    cap.release()
    return frame_paths
