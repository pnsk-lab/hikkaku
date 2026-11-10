# src/test/projects

- Place macro project-level tests here.
- Prefer adding cases close to real-world operation, and keep duplicate fine-grained checks in unit tests under `src/`.
- For changes that update expected output, consider running `moon test --update`.
- For project-level tests, use `hikkaku` to generate `project.json` and keep the generated artifact under test expectations.
