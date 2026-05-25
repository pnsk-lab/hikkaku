# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "onnx>=1.18,<2",
#   "torch>=2.6,<3",
# ]
# ///

from pathlib import Path

import torch
import torch.nn as nn


class XorNet(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(2, 4),
            nn.ReLU(),
            nn.Linear(4, 1),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


def main() -> None:
    torch.manual_seed(7)

    inputs = torch.tensor(
        [
            [0.0, 0.0],
            [0.0, 1.0],
            [1.0, 0.0],
            [1.0, 1.0],
        ],
        dtype=torch.float32,
    )
    labels = torch.tensor([[0.0], [1.0], [1.0], [0.0]], dtype=torch.float32)

    model = XorNet()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.08)
    loss_fn = nn.BCELoss()

    model.train()
    for step in range(4000):
        optimizer.zero_grad()
        predictions = model(inputs)
        loss = loss_fn(predictions, labels)
        loss.backward()
        optimizer.step()

        if loss.item() < 0.002:
            break

    model.eval()
    with torch.no_grad():
        predictions = model(inputs)

    artifact_dir = Path(__file__).resolve().parent / "artifacts"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    onnx_path = artifact_dir / "xor-mlp.onnx"

    torch.onnx.export(
        model,
        inputs[:1],
        onnx_path,
        input_names=["input"],
        output_names=["output"],
        opset_version=17,
        dynamo=False,
    )

    print("trained predictions:", predictions.squeeze().tolist())
    print(f"wrote {onnx_path}")


if __name__ == "__main__":
    main()
