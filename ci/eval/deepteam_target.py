"""DeepTeam callback stub. Does not call a model and does not vendor deepteam."""


def model_callback(prompt, *args, **kwargs):
    raise RuntimeError(
        "NOT RUN: deepteam live target is disabled. "
        "Set a simulator model in an untracked local override and wire this callback "
        "to the operator-owned 9router endpoint yourself. "
        "This repository does not invent an endpoint and does not vendor confident-ai/deepteam."
    )
