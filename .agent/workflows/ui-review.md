---
description: UI Design review process - required before any frontend development
---

# UI Design Review Workflow

**Owner**: Harper (Design Lead)
**Gate Keepers**: Sophia, Liam, Ava (Product Managers)

## Prerequisites

Before submitting for design review:
- [ ] PRD is approved by Product Managers
- [ ] User stories have acceptance criteria
- [ ] Backend API contracts are documented (Swagger)

## Review Stages

### Stage 1: Wireframe Review

**Attendees**: Harper (Design), Sophia (PM), Dylan (Frontend Lead)

1. Jordan-D presents wireframes and user flows
2. Review against PRD requirements
3. Discuss edge cases and error states
4. PM signs off on information architecture

**Approval Required**: Harper + Sophia
**Output**: Approved wireframes for high-fidelity design

---

### Stage 2: Visual Design Review

**Attendees**: All PMs (Sophia, Liam, Ava), Harper, Sam

1. Sam presents high-fidelity mockups
2. Review all states:
   - Default state
   - Loading state
   - Empty state
   - Error state
   - Success state
   - Hover/Focus states
3. Review mobile responsiveness
4. Check brand consistency
5. Validate accessibility (contrast, font sizes)

**Approval Required**: Harper + All relevant PMs
**Output**: Approved visual designs for development

---

### Stage 3: Frontend Handoff

**Attendees**: Harper, Dylan, Avery/Blake (Frontend Seniors)

1. Harper presents final specs in Figma
2. Review component breakdown
3. Discuss animations and micro-interactions
4. Identify reusable components
5. Estimate development effort

**Approval Required**: Harper + Dylan
**Output**: Development-ready specs with all assets

---

### Stage 4: Implementation Review

After frontend builds the feature:

**Attendees**: Harper, Sophia, Dylan, Frontend developer

1. Compare implementation to designs
2. Check pixel-perfect alignment
3. Test all interaction states
4. Review on multiple devices/browsers
5. Accessibility audit

**Approval Required**: Harper
**Output**: Approved for QA testing

---

## Review Checklist

### For Designers (Before Submitting)

- [ ] All user flows documented
- [ ] All states covered (loading, error, empty, success)
- [ ] Responsive breakpoints defined (mobile, tablet, desktop)
- [ ] Accessibility checked (contrast ratios, focus states)
- [ ] Animations/transitions specified
- [ ] Assets exported at correct resolutions

### For PMs (During Review)

- [ ] Matches PRD requirements
- [ ] User stories are addressed
- [ ] Edge cases handled
- [ ] Consistent with product vision
- [ ] Technical feasibility confirmed with Frontend Lead

### For Frontend (During Handoff)

- [ ] Design tokens available (colors, typography, spacing)
- [ ] Component structure clear
- [ ] API integration points identified
- [ ] Loading/error handling defined
- [ ] Responsive behavior specified

---

## Escalation Path

If reviewers disagree:

1. **Harper** (Design Lead) has final say on visual/UX decisions
2. **Sophia** (PM) has final say on product requirements
3. **Dylan** (Frontend Lead) flags technical blockers
4. **Nathan** (Principal Architect) mediates technical disputes
5. **YOU** (Founder) breaks deadlocks on product vision

---

## Templates

### Design Review Request
```
Subject: [Design Review] {Feature Name} - {Stage}

Feature: {name}
PRD Reference: PRD-{number}
Stage: Wireframe / Visual / Handoff
Designer: {name}

Figma Link: {url}
Review Date: {date/time}

Attendees Required:
- [ ] Harper (Design Lead)
- [ ] Sophia (PM)
- [ ] Dylan (Frontend Lead)

Notes:
{any context or decisions needed}
```

### Design Approval
```
Feature: {name}
Stage: {stage}
Date: {date}

Approvers:
- Harper (Design Lead): ✅ Approved / ❌ Rejected
- Sophia (PM): ✅ Approved / ❌ Rejected
- Dylan (Frontend Lead): ✅ Feasible / ⚠️ Concerns

Feedback:
{comments}

Next Steps:
{what happens next}
```

---

## Current Status

**UI Development Status**: NOT STARTED

The frontend team is waiting for:
1. ✅ Swagger API documentation (in progress)
2. ⬜ Design mockups from Harper/Jordan-D/Sam
3. ⬜ PM approval on designs (Gate 1: Wireframes)
4. ⬜ PM approval on visual designs (Gate 2: High-fidelity)
5. ⬜ Frontend handoff meeting (Gate 3)

**Next Step**: Harper to schedule wireframe review with Sophia
