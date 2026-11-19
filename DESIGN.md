# Product Design Guidelines

## Product Character

The product is a professional UX knowledge assistant.

It should feel:

- credible
- calm
- focused
- precise
- evidence-based
- modern without appearing fashionable or decorative

The interface should support focused reading and research. It must not resemble
a generic AI chatbot or an unmodified component-library template.

## Core Experience

The primary user flow is:

1. Ask a UX-related question.
2. Receive a clear and structured answer.
3. Identify which statements are supported by literature.
4. Inspect the corresponding books, chapters, and pages.
5. Distinguish literature evidence from additional AI interpretation.
6. Ask a follow-up question without losing context.

## Main Interface

Use a responsive application shell with:

- a compact navigation sidebar
- a primary conversation area
- an optional source and citation panel
- a document-library area
- clear document-processing states

The answer should remain the visual focus. Navigation and metadata should be
available without competing with the content.

## Answer Structure

Visually distinguish:

- the direct answer
- literature-supported findings
- additional AI interpretation
- citations and source references
- limitations or insufficient evidence

Citations should be attached to the relevant claims rather than shown only as
an unrelated list at the bottom.

Source references should display, when available:

- book title
- author
- chapter or section
- printed page number
- PDF page index

Users should be able to open a source preview from a citation.

## Visual Direction

Use a restrained neutral palette with one deliberate accent color.

Avoid:

- excessive gradients
- decorative glass effects
- oversized rounded cards
- excessive shadows
- unnecessary animations
- generic dashboard layouts
- excessive use of badges
- large empty hero sections inside the application

Prefer:

- strong typography
- compact but comfortable spacing
- subtle borders
- clear hierarchy
- readable line lengths
- consistent alignment
- intentional whitespace

## Typography

Optimize typography for reading long, evidence-based answers.

- Use a clean sans-serif typeface for the interface.
- Keep answer text within a comfortable reading width.
- Use headings sparingly.
- Use monospace only for technical content.
- Ensure source metadata remains readable at smaller sizes.
- Do not use low-contrast gray text for important information.

## Components

Use shadcn/ui as the component foundation, but customize components to match
this design direction.

Create reusable product-level components such as:

- `AppShell`
- `Conversation`
- `Message`
- `AnswerSection`
- `Citation`
- `SourcePreview`
- `EvidenceIndicator`
- `PromptInput`
- `DocumentUploader`
- `DocumentProcessingStatus`
- `EmptyState`
- `ErrorState`

Do not duplicate interaction patterns or create slightly different versions of
the same component without a clear reason.

## Accessibility

- Meet WCAG 2.2 AA contrast requirements.
- Ensure full keyboard navigation.
- Provide visible focus states.
- Use semantic HTML.
- Label icon-only controls.
- Do not rely on color alone to communicate source status.
- Respect reduced-motion preferences.
- Keep interactive targets large enough for touch input.

## Responsive Behavior

The application must work on desktop, tablet, and mobile.

On smaller screens:

- collapse the navigation sidebar
- show source details in a drawer or sheet
- keep the prompt input accessible
- avoid horizontal scrolling in answers
- preserve citation usability

## Motion

Use motion only to explain state changes or maintain spatial continuity.

Animations should be short and subtle. Avoid continuous decorative animation.

## Implementation Rules

- Use centralized design tokens.
- Avoid arbitrary colors and spacing values when a token exists.
- Test loading, empty, error, streaming, and completed states.
- Use realistic UX questions and citations when evaluating layouts.
- Do not use placeholder-heavy layouts as the final implementation.