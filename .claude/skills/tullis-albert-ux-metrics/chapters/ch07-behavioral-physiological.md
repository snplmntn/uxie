# Chapter 7: Behavioral and Physiological Metrics

## Core Idea
Participants reveal much more than task outcomes and questionnaire answers: comments, facial expressions, gaze, pupil size, skin conductance. Structure your observation in advance so these can be counted; use equipment-based measures (eye-tracking especially) to learn whether users even looked at something.

## Frameworks Introduced
- **Verbal behavior coding**: catalogue every comment and classify it. The headline metric is the **ratio of positive to negative comments**, compared across iterations or products. Finer categories:
  - Strongly positive · other positive · strongly negative · other negative
  - Suggestion for improvement · question ("How does this work?")
  - Variation from expectation ("This isn't what I was expecting")
  - Stated confusion ("This page doesn't make any sense") · stated frustration ("At this point I'd just shut it off!")
- **Nonverbal behavior coding**: frowning/grimacing; smiling/laughing; surprise; furrowed brow; impatience; leaning close to the screen; fidgeting; random mouse movement; groaning/deep sigh; rubbing head/eyes/neck. Most useful when the product has physical, perceptual or cognitive demands (e.g. squinting at a tiny serial number).
- **Observation coding form** (per task): checkboxes for the verbal and nonverbal codes above plus task completion status: *incomplete* (gave up / called by moderator / thought complete but wasn't) or *complete* (fully / with assistance / partial). Have multiple observers code independently, then reach consensus.
- **Eye-tracking analyses**
  - % of participants who fixated an area of interest. Define the area by x,y coordinates and set a minimum total fixation time (the authors used **500 ms**).
  - Time in regions as a **percentage of time on the page** (not absolute); define all regions with no gaps; count only time spent on the task.
  - Gaze plots (sequence; circle size = fixation duration) and heat maps (fixation density across participants).
- **Facial expression analysis**: FACS (Ekman & Friesen; 46 facial actions) by trained coders from video; automated video analysis was still emerging.
- **Pupillary response**: dilation tracks mental workload and arousal.
- **Skin conductance and heart rate**: detect frustration, but too intrusive for routine tests (at the time).

## Key Concepts
- **Fixation**: a pause of the eye within a small area. **Saccade**: movement between fixations.
- **Area of interest / look-zone**: the defined region analyzed in eye-tracking.
- **Overt vs. covert behavior**: observable by an attentive moderator vs. needing equipment.

## Mental Models
- Use eye-tracking to separate "never saw the link" from "saw it and rejected the wording"; memory-based answers are unreliable.
- Positive:negative comment ratios mean little alone; their value is in comparison across designs or iterations.
- Long waits show up as finger drumming and groans even when participants say nothing; code impatience behaviors when response time is a concern.

## Anti-patterns
- **Free-form notes with no structure**: hard to turn into metrics afterwards.
- **Absolute gaze times across participants**: these vary widely, so normalize to a percentage of page time.
- **Including debrief time in gaze data.**
- **Presenting look-zone numbers without a heat map**: viewers always ask where exactly people looked.

## Worked Example
Comparing four designs of the same small page region ("bricklet") during four tasks, only one of which concerned that region: metric = % of participants with ≥500 ms total fixation on the bricklet. Bricklet B drew the most participants, so it is the most noticeable treatment. In another study, ads placed below the branding area received about 7× more gaze time than ads above it (Albert, 2002).

## Key Takeaways
1. Build a per-task coding form (verbal, nonverbal, completion status) before testing.
2. Track the positive:negative comment ratio across iterations.
3. Stated confusion, stated frustration and "variation from expectation" are direct issue signals.
4. Eye-tracking answers "did they even see it?" with a fixation threshold of about 500 ms.
5. Physiological measures (pupil, skin conductance, heart rate) indicate workload and stress, but were intrusive at the time of writing.

## Connects To
- **Ch 5**: think-aloud cues for identifying issues.
- **Ch 3**: awareness studies and positive-UX products use these measures.
- **Ch 10.5**: fixation count and duration in a drug-label study.
