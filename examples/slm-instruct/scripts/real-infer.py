#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "torch==2.8.0",
#   "transformers==4.56.0",
# ]
# ///

from __future__ import annotations

import argparse
from pathlib import Path

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    GenerationConfig,
    TextStreamer,
)


ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS = ROOT / "artifacts"
DEFAULT_PROMPT = "Hello world"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("prompt", nargs="?", default=DEFAULT_PROMPT)
    parser.add_argument("--model", default=str(ARTIFACTS))
    parser.add_argument("--max-new-tokens", type=int, default=8)
    parser.add_argument("--temperature", type=float, default=1.0)
    parser.add_argument("--top-p", type=float, default=1.0)
    parser.add_argument("--repetition-penalty", type=float, default=1.0)
    parser.add_argument("--trust-remote-code", action="store_true", default=True)
    parser.add_argument("--no-trust-remote-code", dest="trust_remote_code", action="store_false")
    parser.add_argument("--local-files-only", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    model_name_or_path = args.model

    tokenizer = AutoTokenizer.from_pretrained(
        model_name_or_path,
        trust_remote_code=args.trust_remote_code,
        local_files_only=args.local_files_only,
    )
    model = AutoModelForCausalLM.from_pretrained(
        model_name_or_path,
        trust_remote_code=args.trust_remote_code,
        local_files_only=args.local_files_only,
    )
    model.eval()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    generation_config = GenerationConfig(
        max_new_tokens=args.max_new_tokens,
        use_cache=True,
        do_sample=False,
        temperature=args.temperature,
        top_p=args.top_p,
        repetition_penalty=args.repetition_penalty,
        pad_token_id=model.config.pad_token_id,
        eos_token_id=model.config.eos_token_id,
    )
    streamer = TextStreamer(
        tokenizer=tokenizer,
        skip_prompt=True,
    )

    conversation = [{"role": "user", "content": args.prompt}]
    inputs = tokenizer.apply_chat_template(
        conversation=conversation,
        tokenize=True,
        return_tensors="pt",
    ).to(device)

    model.generate(
        inputs,
        tokenizer=tokenizer,
        generation_config=generation_config,
        streamer=streamer,
    )


if __name__ == "__main__":
    main()
