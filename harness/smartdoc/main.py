"""CLI entrypoint for SuperQuantumAGI SmartDoc / SmartBook."""

from __future__ import annotations

import sys
from argparse import ArgumentParser
from pathlib import Path

# Support running directly via `python3 harness/smartdoc/main.py`
if __package__ in {None, ""}:
    parent = Path(__file__).resolve().parent
    sys.path.insert(0, str(parent.parent))
    from smartdoc.commands import (
        add_smartbook_cli,
        add_smartdoc_cli,
        dispatch_smartbook,
        dispatch_smartdoc,
    )
else:
    from .commands import (
        add_smartbook_cli,
        add_smartdoc_cli,
        dispatch_smartbook,
        dispatch_smartdoc,
    )

SMARTBOOK_ACTIONS = frozenset({"list", "inspect", "ingest", "retrieve", "validate"})


def build_parser() -> ArgumentParser:
    parser = ArgumentParser(prog="smartdoc-cli", description="SuperQuantumAGI SmartDoc / SmartBook CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sd = sub.add_parser("smartdoc", help="document profiles, extract, status")
    add_smartdoc_cli(sd)

    sb = sub.add_parser("smartbook", help="reusable SmartBook lifecycle")
    add_smartbook_cli(sb)

    return parser


def main(argv: list[str] | None = None) -> int:
    args_list = list(sys.argv[1:] if argv is None else argv)
    if args_list and args_list[0] not in {"smartdoc", "smartbook", "-h", "--help"}:
        # Conveniences: auto-prefix smartbook or smartdoc if command was passed directly
        if args_list[0] in SMARTBOOK_ACTIONS:
            args_list = ["smartbook"] + args_list
        else:
            args_list = ["smartdoc"] + args_list

    parser = build_parser()
    args = parser.parse_args(args_list)

    if args.cmd == "smartdoc":
        return dispatch_smartdoc(args)
    if args.cmd == "smartbook":
        return dispatch_smartbook(args)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
