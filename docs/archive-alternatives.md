# SuperQuantumAGI - Archive Alternatives (Tier 3)

> **Document Status:** Tier 3 Archived Components Reference (PRD §6.13 & §10.2).
> **Rule:** No component is simply deleted or forgotten; components that are superseded, unlicensed, or incompatible are archived with clear rationale and designated replacements.

---

## 1. Gateway & Model Routing Components (Removed by Design Override)

| Component | Category | Original Role | Archive Rationale | Replacement / Architecture in SuperQuantumAGI |
|---|---|---|---|---|
| **LiteLLM** | Gateway / Proxy | Model gateway & budget tracking | **REMOVED COMPLETELY.** Unnecessary proxy layer that added network latency and complexity. Model routing is handled natively by 9router directly within OpenCode. | **Native 9router** (configured directly in OpenCode global configuration). |
| **jev-model-router** | Custom Router Mod | Multi-tier routing mod | **REMOVED COMPLETELY.** Superseded by native 9router model tiering. No custom routing layer is required. | **Native 9router** model tiering (`fast` / `coding` / `reasoning`). |

---

## 2. Unlicensed & Problematic Licensing Components

| Component | Original License Status | Archive Rationale | Permissive Replacement (Tier 1) |
|---|---|---|---|
| **remotion-dev/skills** | No license file in repository | Incompatible with clean permissive distribution. | **`claude-remotion-skill`** (Permissive MIT, by haidrrrry). |
| **klik-anim-skill-creation** | No license file | Incompatible. | **`claude-motion-design`** (MIT) + **`gsap-skills`** (MIT). |
| **gods-eye-view** | NOASSERTION / Ambiguous | Risk of copyright ambiguity. | **`leafmap`** (MIT, opengeos) + **`geo-sleuth`** (MIT). |
| **Turnitout-Humanizer** | NOASSERTION / Academic ethics risk | Dubious provenance and non-asserted license. | **`antislop-sampler`** (Apache-2.0) + **`humanizer`** (MIT). |
| **autogki-patcher** | No license | Kernel patching script without license grant. | **Standard mkbootimg / avbtool** (Apache-2.0) via CLI. |

---

## 3. Copyleft / AGPL Offensive Tools (Not Vendored)

These tools are not included in the repository source tree to protect repository license hygiene. They are supported strictly as external, detached pointers or network endpoints if invoked under an authorized `--pentest` scope:

| Component | License | Archive / Pointer Status | Permissive / Native Alternative |
|---|---|---|---|
| **ARTEX** | AGPL-3.0 | Archived from core; replaced with MIT platform. | **PentAGI** (MIT) / **strix** (Apache-2.0). |
| **CyberStrike** | AGPL-3.0 | Archived from core. | **Decepticon** (Apache-2.0). |
| **BunkerWeb** | AGPL-3.0 | Archived from internal runtime; pointer only. | **OWASP Coraza** (Apache-2.0). |
| **Sliver / AdaptixC2** | GPL-3.0 | Never vendored. External process pointer only under explicit consent. | **Mythic** (BSD-3-Clause) as permissive alternative. |

---

## 4. SuperQ Redundant Quality Loops

In SuperQuantumAGI, the 5 fragmented review loops from older prototypes were consolidated into the **Unified Done-Gate** (`exit==0 AND artifacts exist AND tests green`) and **Anti-Spin** (`max_iterations=3`):

| Archived Loop | Former Function | Replacement in SuperQuantumAGI |
|---|---|---|
| `adversarial-review-loop` | LLM-based debate loop | Unified Done-Gate (deterministic test validation). |
| `devils-advocate-loop` | Adversarial reasoning | Root-Cause Gate (RCG) + Scope Guard. |
| `quality-streak-loop` | Heuristic repetition check | Anti-Spin hardcoded iteration counter. |
| `anti-spin-build-loop` | Heuristic build breaker | Hardcoded circuit breaker (`max_iterations = 3`). |
