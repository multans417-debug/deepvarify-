# DeepVerify — AI Image & Video DeepFake Detection System

A production-structured FastAPI backend for detecting whether an uploaded
image or video is likely REAL, likely AI-generated/manipulated, or
INCONCLUSIVE, using a real, trainable machine-learning pipeline.

**This system ships no pretrained weights.** Until you train and place a
checkpoint, `/api/v1/models` reports the model as unavailable and detection
endpoints return a structured `MODEL_NOT_AVAILABLE` error — never a guess,
never a random score.

## 1. Project overview

- Binary image classifier (EfficientNet-B0 by default) for still images.
- Frame-sampling + face-cropping video pipeline reusing the image model.
- Optional BiGRU + temporal-attention model for genuinely video-level
  (not just per-frame) predictions.
- Grad-CAM explanations for images; ranked suspicious frames for video.
- Full training/evaluation/calibration pipeline with leakage-safe manifests.
- FastAPI REST API with structured errors, OpenAPI docs, and stable,
  frontend-friendly JSON contracts.

## 2. Architecture

See `docs/architecture.md` for the full request-lifecycle diagram. In short:
`FastAPI routes -> services -> ml/ (models, preprocessing, inference,
explainability)`, with a `ModelService` singleton that loads checkpoints once
at startup.

## 3. Features

Image upload/detection, video upload/detection, frame extraction, face
detection/cropping, image-level classification, video-level temporal
classification (when trained), confidence calibration, suspicious-frame
ranking, Grad-CAM, video metadata + SHA-256 hashing, health/model-status
endpoints, full training pipeline, threshold calibration, tests, Docker,
OpenAPI docs.

## 4. Technology stack

Python 3.11+, FastAPI, Uvicorn, Pydantic v2, PyTorch, torchvision, OpenCV,
NumPy, Pillow, scikit-learn, pandas, matplotlib, ffmpeg/ffprobe,
python-multipart. See `pyproject.toml` for exact dependency specs.

## 5. Installation

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install --break-system-packages ".[dev]"
```

Requires `ffmpeg`/`ffprobe` on `PATH` (installed by the Dockerfile; install
locally via your OS package manager, e.g. `apt install ffmpeg` /
`brew install ffmpeg`).

## 6. Environment setup

```bash
cp .env.example .env
```

Edit `.env` as needed — see `.env.example` for every variable and its
default. Run `python scripts/verify_environment.py` to sanity-check Python
version, GPU, ffmpeg, and dependency imports before starting the server.

## 7. Dataset preparation

You must source your own image/video data under a license or dataset
agreement you're authorized to use (e.g. FaceForensics++, Celeb-DF). Lay out
real/fake samples as directories of images; use
`scripts/extract_video_frames.py` first if starting from video. Full details
in `docs/training.md`.

## 8. Manifest creation

```bash
python training/create_manifest.py \
    --real-dir data/raw/real --fake-dir data/raw/fake \
    --dataset-name my_dataset \
    --output data/manifests/image_manifest.csv
```

Splits are assigned at the video-group level to prevent train/val/test
leakage from frames of the same source video.

## 9. Training the image model

```bash
python training/train_image.py \
    --manifest data/manifests/image_manifest.csv \
    --epochs 20 --batch-size 32 --lr 1e-4 \
    --output models/image/
```

## 10. Training the video (temporal) model

```bash
python training/train_video.py \
    --sequence-manifest data/manifests/video_manifest.csv \
    --image-checkpoint models/image/best.pt \
    --epochs 15 --batch-size 4 \
    --output models/video/
```

Optional — without it, video requests still work via baseline frame-score
aggregation.

## 11. Evaluation

```bash
python training/evaluate.py \
    --manifest data/manifests/image_manifest.csv \
    --checkpoint models/image/best.pt \
    --split test --output reports/
```

## 12. Threshold calibration

```bash
python training/calibrate_threshold.py \
    --manifest data/manifests/image_manifest.csv \
    --checkpoint models/image/best.pt \
    --method f1
```

## 13. Model placement

Place trained checkpoints at the paths configured by `IMAGE_MODEL_PATH` /
`VIDEO_MODEL_PATH` (default `models/image/best.pt`, `models/video/best.pt`).
Verify with `python scripts/download_check.py`.

## 14. Starting the FastAPI server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
# or: make run
```

Then open `http://localhost:8000/docs`.

## 15. API usage

See `docs/api.md` for the full reference and curl examples for every
endpoint.

## 16. Docker deployment

```bash
docker compose up --build
```

See `docs/deployment.md`.

## 17. GPU configuration

`DEVICE=auto` (default) selects CUDA > MPS > CPU automatically and never
crashes if no GPU is present. See `docs/deployment.md` for a CUDA Docker
setup.

## 18. Troubleshooting

- **`/models` shows `MODEL_NOT_FOUND`**: no checkpoint at the configured
  path — train one (`docs/training.md`) or point `IMAGE_MODEL_PATH` /
  `VIDEO_MODEL_PATH` at an existing file, then `POST /api/v1/models/reload`.
- **`NO_FACE_DETECTED`**: no face found and `FULL_IMAGE_FALLBACK=false`. Set
  it to `true` or supply an image with a visible face.
- **`VIDEO_DECODE_ERROR`**: codec not supported by the installed
  ffmpeg/OpenCV build, or a corrupted file.
- **Slow inference on CPU**: expected, especially for video; use a smaller
  architecture (`resnet18`), fewer `TARGET_VIDEO_FRAMES`, or a GPU.

## 19. Limitations

- No authentication/authorization — add an auth layer before exposing this
  publicly.
- Detection is a probabilistic ML assessment: false positives and false
  negatives are certain to occur. `confidence` reflects the model's certainty
  in its own output, not ground truth.
- Generalization to deepfake generation methods absent from training data is
  not guaranteed — always run `training/generalization_test.py` and report
  cross-dataset numbers alongside same-dataset ones.
- The JSON-file result store and local temp storage are an MVP design point,
  not built for multi-instance horizontal scaling.
- Grad-CAM shows where the model's attention concentrated — it is not proof
  that a highlighted region was manipulated.

## 20. Ethical considerations

- Never present a `LIKELY_FAKE`/`LIKELY_REAL` label as forensic or legal
  proof; every completed response includes an explicit warning to that
  effect.
- Uploaded media may be sensitive: this system processes locally by default,
  does not send media to third-party APIs, deletes temp files after
  processing unless explicitly configured to persist them, and never logs
  media bytes.
- Be transparent with end users that automated deepfake detection is an
  active research problem with real error rates in both directions.

---

## A. Folder tree

See the top of this repository for the full structure (`app/`, `training/`,
`tests/`, `scripts/`, `models/`, `data/`, `docs/`).

## B. Installation commands

```bash
pip install --break-system-packages ".[dev]"
python scripts/verify_environment.py
```

## C. Environment variables

See `.env.example` (full list) — device selection, thresholds, size/duration
limits, CORS origins, retention.

## D. Model checkpoint requirements

`models/image/best.pt` (required for any detection). `models/video/best.pt`
(optional; enables `inference_mode: "temporal"` for video). Format defined in
`app/ml/models/model_factory.py`.

## E. Dataset preparation steps

See section 7 / `docs/training.md`.

## F. Training commands

See sections 9–10.

## G. Evaluation commands

See section 11, plus `training/generalization_test.py` for cross-dataset
checks.

## H. Backend startup command

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## I. API endpoint summary

`GET /api/v1/health`, `GET /api/v1/models`, `POST /api/v1/models/reload`,
`GET /api/v1/config`, `POST /api/v1/detect/image`, `POST
/api/v1/detect/video`, `GET /api/v1/results/{id}`, `GET
/api/v1/results/{id}/explanation`, `GET /api/v1/results/{id}/frames/{frame_id}`.

## J. Frontend integration instructions

All responses are typed Pydantic models with a stable `success` boolean,
`result_id`, ISO timestamps, and relative media URLs (`explanation.url`,
`suspicious_frames[].preview_url`) — fetch these directly against the API
base URL. CORS is controlled by `FRONTEND_ORIGINS`.

## K. Known limitations

See section 19 above.

## L. Next recommended technical improvements

- Add authentication and per-user rate limiting before any public deployment.
- Replace the JSON-file result store with PostgreSQL behind the same
  `ResultStore` interface for multi-instance deployments.
- Add async job processing (Celery/RQ + Redis) for large video uploads so
  requests don't block on long inference.
- Expand face-detector options (RetinaFace/MediaPipe) behind the existing
  `FaceDetectorInterface` for higher accuracy than the MTCNN/Haar defaults.
- Add model versioning/A-B rollout support in `ModelService`.
