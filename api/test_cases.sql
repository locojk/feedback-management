-- Feedback for patient 1001 from week 1 to week 4
-- Week 1: Feedback is positive. Treatment is working well. 
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1001, 'Physical Therapy', 'The pain has definitely reduced in the first week. I’m moving much better now, much more comfortable.', '2025-01-10 09:00:00', 'false', 'treatment');  -- Feedback is good, not severe.

-- Week 2: Feedback is still positive, but some struggle with exercises.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1001, 'Physical Therapy', 'I’m still feeling good after the second week, but I think it’s getting a little harder to continue the exercises.', '2025-01-17 09:00:00', 'false', 'treatment');  -- Feedback still positive, no severity.

-- Week 3: Feedback starts turning negative. Pain is coming back slightly.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1001, 'Physical Therapy', 'Week 3, and I feel like the pain is starting to come back a little. I’m struggling more with the exercises.', '2025-01-24 09:00:00', 'false', 'treatment');  -- Feedback is slightly worse, but not severe.

-- Week 4: Feedback is negative, pain is worse and treatment isn't helping.
-- INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
-- VALUES (1001, 'Physical Therapy', 'By week 4, I’m feeling much worse. The pain is stronger than before, and I can barely complete my exercises now.', '2025-01-31 09:00:00', 'true', 'treatment');  -- Feedback is bad, and it's severe (pain stronger than before).

-- Feedback for patient 1002 from week 1 to week 4
-- Week 1: Feedback is good, medication is working.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1002, 'Medication', 'I started the medication and felt much better within the first few days. No side effects so far.', '2025-01-10 10:00:00', 'false', 'medication');  -- Feedback is positive, not severe.

-- Week 2: Feedback is negative. Dizziness starts as a side effect.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1002, 'Medication', 'In week 2, the dizziness started. I didn’t think it would be this bad, but it’s definitely affecting me now.', '2025-01-17 10:00:00', 'false', 'medication');  -- Feedback is bad (side effect), not severe.

-- Week 3: Feedback is worse. Dizziness continues and worsens.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1002, 'Medication', 'It’s week 3, and I’m still dizzy and feeling nauseous. I might need to reconsider this medication.', '2025-01-24 10:00:00', 'true', 'medication');  -- Feedback is bad, and it’s severe (side effects worsening).

-- Week 4: Feedback is negative and severe. Patient stopped medication due to worsening symptoms.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1002, 'Medication', 'By week 4, I stopped taking the medication because it made me feel worse. I’m not sure what to do now.', '2025-01-31 10:00:00', 'true', 'medication');  -- Feedback is bad and severe, patient stopped medication.

-- Feedback for patient 1003 from week 1 to week 4
-- Week 1: Feedback is positive, post-surgery recovery is going well.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1003, 'Surgery', 'Right after the surgery, I felt okay. The pain was manageable and I thought I was healing well.', '2025-01-10 08:30:00', 'false', 'treatment');  -- Feedback is positive, not severe.

-- Week 2: Feedback remains positive, improvement continues.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1003, 'Surgery', 'By week 2, I was feeling pretty good. The pain was minor, and I thought I was almost back to normal.', '2025-01-17 08:30:00', 'false', 'treatment');  -- Feedback is still positive, no severity.

-- Week 3: Feedback starts to worsen, sharp pain starts again.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1003, 'Surgery', 'In week 3, I started feeling a sharp pain again in the area of the surgery. Not sure if this is normal.', '2025-01-24 08:30:00', 'false', 'treatment');  -- Feedback is worse, pain reappears, but not severe yet.

-- Week 4: Feedback is bad, severe pain has returned.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1003, 'Surgery', 'By week 4, the pain is back even worse than before. I’m worried about complications and need to see the doctor again.', '2025-01-31 08:30:00', 'true', 'treatment');  -- Feedback is bad and severe, pain has worsened significantly.

-- Feedback for patient 1004 from week 1 to week 4
-- Week 1: Feedback is positive, patient starts physical therapy with good results.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1004, 'Physical Therapy', 'In the first week, I was able to start walking more easily. I can feel the improvement.', '2025-01-10 14:00:00', 'false', 'treatment');  -- Feedback is positive, not severe.

-- Week 2: Feedback is still good, patient feels improvement.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1004, 'Physical Therapy', 'By week 2, I felt even better. I can walk around without pain now, which feels amazing.', '2025-01-17 14:00:00', 'false', 'treatment');  -- Feedback is positive, no severity.

-- Week 3: Feedback is neutral, patient feels progress has slowed.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1004, 'Physical Therapy', 'In week 3, I was still improving, but now I feel like it’s plateauing a bit. Not as much progress as before.', '2025-01-24 14:00:00', 'false', 'treatment');  -- Feedback is neutral, no severity.

-- Week 4: Feedback is positive, patient feels strong and better than before.
INSERT INTO nkw2tiuvgv6ufu1z.patient_feedback (patient_id, treatment, feedback, datetime, is_severe, feedback_type) 
VALUES (1004, 'Physical Therapy', 'By week 4, I’m feeling even stronger! I can do almost everything without pain, it’s amazing.', '2025-01-31 14:00:00', 'false', 'treatment');  -- Feedback is positive, not severe.
