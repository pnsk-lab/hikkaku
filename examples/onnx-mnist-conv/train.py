# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "onnx>=1.18,<2",
#   "torch>=2.7,<3",
#   "torchvision>=0.22,<1",
# ]
# ///

from __future__ import annotations

import json
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms


ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
DATA_DIR = ARTIFACT_DIR / "mnist-data"
MODEL_PATH = ARTIFACT_DIR / "mnist-conv.onnx"
SAMPLES_PATH = ARTIFACT_DIR / "mnist-samples.json"

TRAIN_SAMPLES = 20_000
TEST_SAMPLES = 4_000
EPOCHS = 4
BATCH_SIZE = 128
SAMPLE_COUNT = 10
IMAGE_SIZE = 28


class MnistConvNet(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Conv2d(1, 6, kernel_size=5, stride=4, padding=1),
            nn.ReLU(),
            nn.Flatten(),
            nn.Linear(6 * 7 * 7, 10),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


def build_datasets() -> tuple[Subset, Subset]:
    transform = transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
        ]
    )
    train = datasets.MNIST(DATA_DIR, train=True, download=True, transform=transform)
    test = datasets.MNIST(DATA_DIR, train=False, download=True, transform=transform)
    return (
        Subset(train, range(TRAIN_SAMPLES)),
        Subset(test, range(TEST_SAMPLES)),
    )


def evaluate(model: nn.Module, loader: DataLoader) -> float:
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for images, labels in loader:
            logits = model(images)
            predictions = logits.argmax(dim=1)
            correct += (predictions == labels).sum().item()
            total += labels.size(0)
    return correct / max(total, 1)


def collect_samples(dataset: Subset) -> list[dict[str, object]]:
    inner = dataset.dataset
    selected: dict[int, list[float]] = {}
    labels: dict[int, int] = {}

    for index in dataset.indices:
        image, label = inner[index]
        if label in selected:
            continue
        selected[label] = image.squeeze(0).reshape(-1).tolist()
        labels[label] = label
        if len(selected) == SAMPLE_COUNT:
            break

    ordered_labels = sorted(labels)
    return [
        {
            "label": label,
            "pixels": selected[label],
        }
        for label in ordered_labels
    ]


def main() -> None:
    torch.manual_seed(7)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    train_dataset, test_dataset = build_datasets()
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

    model = MnistConvNet()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.003)
    loss_fn = nn.CrossEntropyLoss()

    model.train()
    for epoch in range(EPOCHS):
        total_loss = 0.0
        steps = 0
        for images, labels in train_loader:
            optimizer.zero_grad()
            logits = model(images)
            loss = loss_fn(logits, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            steps += 1

        accuracy = evaluate(model, test_loader)
        average_loss = total_loss / max(steps, 1)
        print(f"epoch {epoch + 1}: loss={average_loss:.4f} accuracy={accuracy:.4f}")

    model.eval()
    dummy = torch.zeros(1, 1, IMAGE_SIZE, IMAGE_SIZE, dtype=torch.float32)
    torch.onnx.export(
        model,
        dummy,
        MODEL_PATH,
        input_names=["input"],
        output_names=["output"],
        opset_version=17,
        dynamo=False,
    )

    samples = collect_samples(test_dataset)
    SAMPLES_PATH.write_text(json.dumps(samples))
    print(f"wrote {MODEL_PATH}")
    print(f"wrote {SAMPLES_PATH}")


if __name__ == "__main__":
    main()
