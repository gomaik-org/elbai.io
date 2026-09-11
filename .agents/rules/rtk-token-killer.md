# RTK (Rust Token Killer) Optimization Guardrail

## Invariant
All command-line executions must leverage token-efficient output. RTK proxies command outputs to cut tokens by up to 90%.

## Rules
- When running Git commands: `rtk git status`, `rtk git diff`, `rtk git log`.
- When inspecting analytics: `rtk gain`, `rtk gain --history`.
- In case of low-level diagnostics or debugging: `rtk proxy <cmd>`.
- Never dump multi-megabyte log files or full test logs into agent context if a summary or filtered test execution suffices.
