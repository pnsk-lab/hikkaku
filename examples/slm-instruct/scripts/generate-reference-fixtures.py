#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "torch==2.8.0",
#   "transformers==4.56.0",
# ]
# ///

from __future__ import annotations

import json
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer


ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS = ROOT / "artifacts"
RUNTIME = ARTIFACTS / "runtime"
DATE_STRING = "December 2024"
MODEL_PROMPT = "What is 2 + 2?"
TOKENIZER_CASES = [
    "Hello world",
    "What's up?",
    "2 + 2 = 4",
    "List three colors.",
    "Line 1\nLine 2",
]


def main() -> None:
    runtime_metadata = json.loads((RUNTIME / "tokenizer-metadata.json").read_text(encoding="utf-8"))
    tokenizer = AutoTokenizer.from_pretrained(
        str(ARTIFACTS),
        trust_remote_code=True,
        local_files_only=True,
    )
    model = AutoModelForCausalLM.from_pretrained(
        str(ARTIFACTS),
        trust_remote_code=True,
        local_files_only=True,
    )
    model.eval()

    prefix_ids = list(runtime_metadata["chatTemplate"]["prefixIds"])
    suffix_ids = list(runtime_metadata["chatTemplate"]["suffixIds"])

    tokenizer_cases = []
    for text in TOKENIZER_CASES:
        token_ids = tokenizer(text, add_special_tokens=False)["input_ids"]
        decoded = tokenizer.decode(
            token_ids,
            clean_up_tokenization_spaces=False,
            skip_special_tokens=False,
        )
        tokenizer_cases.append(
            {
                "text": text,
                "token_ids": token_ids,
                "decoded": decoded,
            }
        )

    user_token_ids = tokenizer(MODEL_PROMPT, add_special_tokens=False)["input_ids"]
    full_prompt_ids = prefix_ids + user_token_ids + suffix_ids
    input_ids = torch.tensor([full_prompt_ids], dtype=torch.long)

    with torch.no_grad():
        outputs = model(input_ids=input_ids, use_cache=True)
    topk = torch.topk(outputs.logits[0, -1], k=5)
    prefill_top_ids = topk.indices.tolist()
    prefill_top_logits = [float(value) for value in topk.values.tolist()]

    greedy = {}
    for steps in (1, 4, 8):
        generated = model.generate(
            input_ids=input_ids,
            max_new_tokens=steps,
            do_sample=False,
            use_cache=True,
            pad_token_id=model.config.pad_token_id,
            eos_token_id=model.config.eos_token_id,
        )
        generated_ids = generated[0, len(full_prompt_ids) :].tolist()
        greedy[str(steps)] = {
            "token_ids": generated_ids,
            "text": tokenizer.decode(
                generated_ids,
                clean_up_tokenization_spaces=False,
                skip_special_tokens=False,
            ),
        }

    fixture = {
        "date_string": DATE_STRING,
        "model_prompt": MODEL_PROMPT,
        "tokenizer": {
            "cases": tokenizer_cases,
            "prefix_ids": prefix_ids,
            "suffix_ids": suffix_ids,
            "prompt_user_token_ids": user_token_ids,
        },
        "model": {
            "prompt": MODEL_PROMPT,
            "prompt_token_ids": full_prompt_ids,
            "prefill_top_ids": prefill_top_ids,
            "prefill_top_logits": prefill_top_logits,
            "greedy_1": greedy["1"],
            "greedy_4": greedy["4"],
            "greedy_8": greedy["8"],
        },
    }

    (ARTIFACTS / "reference-fixtures.json").write_text(
        json.dumps(fixture, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
