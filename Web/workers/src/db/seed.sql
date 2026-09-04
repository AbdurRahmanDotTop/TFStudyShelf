-- ═══════════════════════════════════════════════════════════════
-- TF Study Shelf — Seed Data (Development)
-- Run: npm run db:seed
-- ═══════════════════════════════════════════════════════════════

-- ─── Admin User ──────────────────────────────────────────────
INSERT OR IGNORE INTO admin_users (id, firebase_uid, email, display_name, role) VALUES
  ('admin-001', 'dev-admin', 'admin@techilyfly.com', 'Super Admin', 'SUPER_ADMIN');

-- ─── Categories ──────────────────────────────────────────────
INSERT OR IGNORE INTO categories (id, name, description, display_order) VALUES
  ('cat-science', 'Science', 'Natural sciences and scientific methods', 1),
  ('cat-math', 'Mathematics', 'Algebra, calculus, geometry, and more', 2),
  ('cat-physics', 'Physics', 'Mechanics, thermodynamics, and electromagnetism', 3),
  ('cat-chemistry', 'Chemistry', 'Organic, inorganic, and physical chemistry', 4),
  ('cat-biology', 'Biology', 'Zoology, botany, and human biology', 5),
  ('cat-history', 'History', 'World history and civilizations', 6),
  ('cat-literature', 'Literature', 'Classic and modern literary works', 7),
  ('cat-cs', 'Computer Science', 'Programming, algorithms, and data structures', 8),
  ('cat-selfdev', 'Self Development', 'Personal growth and productivity', 9),
  ('cat-economics', 'Economics', 'Micro and macroeconomics', 10);

-- ─── Subjects ────────────────────────────────────────────────
INSERT OR IGNORE INTO subjects (id, name, description, category_id, display_order) VALUES
  ('sub-mech', 'Mechanics', 'Classical mechanics and motion', 'cat-physics', 1),
  ('sub-thermo', 'Thermodynamics', 'Heat and energy transfer', 'cat-physics', 2),
  ('sub-organic', 'Organic Chemistry', 'Carbon-based compounds', 'cat-chemistry', 1),
  ('sub-algebra', 'Algebra', 'Linear and abstract algebra', 'cat-math', 1),
  ('sub-calculus', 'Calculus', 'Differential and integral calculus', 'cat-math', 2),
  ('sub-python', 'Python', 'Python programming language', 'cat-cs', 1),
  ('sub-habits', 'Habit Building', 'Building better habits', 'cat-selfdev', 1);

-- ─── Sample Books ────────────────────────────────────────────
INSERT OR IGNORE INTO books (id, title, author, description, language, page_count, difficulty, estimated_read_time_minutes, rights_status, license_name, allowed_download, allowed_offline, allowed_share, status, published_at, created_by, rating, rating_count, featured_order) VALUES
  ('book-001', 'Fundamentals of Physics', 'David Halliday', 'A comprehensive introduction to physics covering mechanics, thermodynamics, electromagnetism, optics, and modern physics. This textbook has been the gold standard for introductory physics courses for decades.', 'en', 1232, 'MEDIUM', 3600, 'OPEN_LICENSE', 'CC BY 4.0', 1, 1, 1, 'PUBLISHED', datetime('now'), 'admin-001', 4.7, 245, 1),
  ('book-002', 'Atomic Habits', 'James Clear', 'An easy and proven way to build good habits and break bad ones. Tiny changes, remarkable results. Learn how small behavioral shifts can lead to remarkable outcomes in your personal and professional life.', 'en', 320, 'EASY', 480, 'AUTHORIZED', NULL, 1, 1, 0, 'PUBLISHED', datetime('now'), 'admin-001', 4.9, 1892, 2),
  ('book-003', 'Introduction to Algorithms', 'Thomas H. Cormen', 'The leading textbook on algorithms, covering a broad range of algorithms in depth while making their design and analysis accessible to all levels of readers. Known as CLRS.', 'en', 1312, 'HARD', 4800, 'OPEN_LICENSE', 'CC BY-NC 3.0', 1, 1, 1, 'PUBLISHED', datetime('now'), 'admin-001', 4.5, 567, 3),
  ('book-004', 'Organic Chemistry', 'Paula Bruice', 'A mechanistic approach to organic chemistry that emphasizes understanding over memorization. Covers reaction mechanisms, stereochemistry, and spectroscopy.', 'en', 864, 'HARD', 2400, 'OPEN_LICENSE', 'CC BY 4.0', 1, 1, 1, 'PUBLISHED', datetime('now'), 'admin-001', 4.3, 189, 4),
  ('book-005', 'Calculus: Early Transcendentals', 'James Stewart', 'The most successful calculus textbook, known for its clear exposition, applied examples, and graded problem sets covering single and multivariable calculus.', 'en', 1368, 'MEDIUM', 4200, 'PUBLIC_DOMAIN', NULL, 1, 1, 1, 'PUBLISHED', datetime('now'), 'admin-001', 4.6, 423, 5),
  ('book-006', 'The Art of Thinking Clearly', 'Rolf Dobelli', 'A compilation of cognitive biases and logical fallacies that affect our decision-making. Each chapter presents a different bias with real-world examples.', 'en', 384, 'EASY', 600, 'AUTHORIZED', NULL, 0, 1, 0, 'PUBLISHED', datetime('now'), 'admin-001', 4.2, 356, NULL),
  ('book-007', 'NCERT Physics Class XII', 'NCERT', 'Official NCERT textbook for Physics Class 12. Covers electrostatics, current electricity, magnetic effects, electromagnetic induction, optics, and modern physics.', 'en', 376, 'MEDIUM', 900, 'PUBLIC_DOMAIN', 'Government Publication', 1, 1, 1, 'PUBLISHED', datetime('now'), 'admin-001', 4.4, 2145, 6),
  ('book-008', 'Python Crash Course', 'Eric Matthes', 'A hands-on, project-based introduction to Python programming. Learn Python fundamentals and then build three projects: a game, data visualization, and a web app.', 'en', 544, 'EASY', 960, 'OPEN_LICENSE', 'CC BY 4.0', 1, 1, 1, 'DRAFT', NULL, 'admin-001', 4.8, 734, NULL);

-- ─── Book Categories ─────────────────────────────────────────
INSERT OR IGNORE INTO book_categories (book_id, category_id) VALUES
  ('book-001', 'cat-physics'), ('book-001', 'cat-science'),
  ('book-002', 'cat-selfdev'),
  ('book-003', 'cat-cs'), ('book-003', 'cat-math'),
  ('book-004', 'cat-chemistry'), ('book-004', 'cat-science'),
  ('book-005', 'cat-math'),
  ('book-006', 'cat-selfdev'),
  ('book-007', 'cat-physics'), ('book-007', 'cat-science'),
  ('book-008', 'cat-cs');

-- ─── Book Subjects ───────────────────────────────────────────
INSERT OR IGNORE INTO book_subjects (book_id, subject_id) VALUES
  ('book-001', 'sub-mech'), ('book-001', 'sub-thermo'),
  ('book-002', 'sub-habits'),
  ('book-004', 'sub-organic'),
  ('book-005', 'sub-calculus'), ('book-005', 'sub-algebra'),
  ('book-007', 'sub-mech'), ('book-007', 'sub-thermo'),
  ('book-008', 'sub-python');

-- ─── Book Tags ───────────────────────────────────────────────
INSERT OR IGNORE INTO book_tags (book_id, tag) VALUES
  ('book-001', 'textbook'), ('book-001', 'university'),
  ('book-002', 'habits'), ('book-002', 'productivity'), ('book-002', 'bestseller'),
  ('book-003', 'algorithms'), ('book-003', 'data-structures'), ('book-003', 'CLRS'),
  ('book-007', 'NCERT'), ('book-007', 'class-12'), ('book-007', 'CBSE');

-- ─── Exam Tags ───────────────────────────────────────────────
INSERT OR IGNORE INTO book_exam_tags (book_id, exam_tag) VALUES
  ('book-001', 'JEE'), ('book-001', 'NEET'),
  ('book-004', 'NEET'), ('book-004', 'JEE'),
  ('book-005', 'JEE'), ('book-005', 'GATE'),
  ('book-007', 'JEE'), ('book-007', 'NEET'), ('book-007', 'CBSE');

-- ─── Sample Chapters ─────────────────────────────────────────
INSERT OR IGNORE INTO chapters (id, book_id, title, chapter_number, summary, word_count, status) VALUES
  ('ch-001-01', 'book-001', 'Measurement', 1, 'Introduction to physical quantities, units, and measurement techniques.', 8500, 'PUBLISHED'),
  ('ch-001-02', 'book-001', 'Motion Along a Straight Line', 2, 'Kinematics of one-dimensional motion including displacement, velocity, and acceleration.', 12000, 'PUBLISHED'),
  ('ch-001-03', 'book-001', 'Vectors', 3, 'Vector addition, subtraction, components, and dot/cross products.', 9800, 'PUBLISHED'),
  ('ch-002-01', 'book-002', 'The Surprising Power of Atomic Habits', 1, 'Why tiny changes make a big difference in long-term outcomes.', 6200, 'PUBLISHED'),
  ('ch-002-02', 'book-002', 'How Your Habits Shape Your Identity', 2, 'The relationship between identity and habits.', 5800, 'PUBLISHED'),
  ('ch-002-03', 'book-002', 'How to Build Better Habits in 4 Simple Steps', 3, 'The four laws of behavior change: cue, craving, response, reward.', 7400, 'PUBLISHED'),
  ('ch-007-01', 'book-007', 'Electric Charges and Fields', 1, 'Coulombs law, electric field, Gauss law, and applications.', 11200, 'PUBLISHED'),
  ('ch-007-02', 'book-007', 'Electrostatic Potential and Capacitance', 2, 'Electric potential, equipotential surfaces, and capacitors.', 10500, 'PUBLISHED');

-- ─── Sample Questions ────────────────────────────────────────
INSERT OR IGNORE INTO questions (id, book_id, chapter_id, question_text, question_type, difficulty, answer, explanation, marks, status, created_by) VALUES
  ('q-001', 'book-001', 'ch-001-02', 'What is the SI unit of acceleration?', 'MCQ', 'EASY', 'm/s²', 'Acceleration is the rate of change of velocity with respect to time, so its SI unit is meters per second squared.', 1, 'PUBLISHED', 'admin-001'),
  ('q-002', 'book-001', 'ch-001-02', 'A car accelerates from rest to 60 m/s in 10 seconds. What is its acceleration?', 'MCQ', 'MEDIUM', '6 m/s²', 'Using a = (v - u) / t = (60 - 0) / 10 = 6 m/s²', 2, 'PUBLISHED', 'admin-001'),
  ('q-003', 'book-002', 'ch-002-01', 'According to James Clear, what makes atomic habits so powerful?', 'SHORT', 'EASY', 'Small, consistent improvements compound over time to produce remarkable results.', 'The 1% improvement concept: getting 1% better each day compounds to become 37 times better over a year.', 1, 'PUBLISHED', 'admin-001'),
  ('q-004', 'book-007', 'ch-007-01', 'State Coulombs law of electrostatic force.', 'LONG', 'MEDIUM', 'The electrostatic force between two point charges is directly proportional to the product of the charges and inversely proportional to the square of the distance between them.', 'F = kq₁q₂/r², where k = 1/(4πε₀) ≈ 9 × 10⁹ Nm²/C²', 3, 'PUBLISHED', 'admin-001');

-- ─── MCQ Options ─────────────────────────────────────────────
INSERT OR IGNORE INTO question_options (id, question_id, option_text, option_order, is_correct) VALUES
  ('opt-001a', 'q-001', 'm/s', 0, 0),
  ('opt-001b', 'q-001', 'm/s²', 1, 1),
  ('opt-001c', 'q-001', 'kg·m/s', 2, 0),
  ('opt-001d', 'q-001', 'N/m', 3, 0),
  ('opt-002a', 'q-002', '3 m/s²', 0, 0),
  ('opt-002b', 'q-002', '6 m/s²', 1, 1),
  ('opt-002c', 'q-002', '10 m/s²', 2, 0),
  ('opt-002d', 'q-002', '60 m/s²', 3, 0);

-- ─── Sample Quiz ─────────────────────────────────────────────
INSERT OR IGNORE INTO quizzes (id, title, description, book_id, chapter_id, time_limit_seconds, randomize, passing_score_percent, difficulty, status, created_by) VALUES
  ('quiz-001', 'Physics Motion Quiz', 'Test your understanding of kinematics and motion', 'book-001', 'ch-001-02', 300, 1, 60, 'MEDIUM', 'PUBLISHED', 'admin-001');

INSERT OR IGNORE INTO quiz_questions (quiz_id, question_id, question_order) VALUES
  ('quiz-001', 'q-001', 0),
  ('quiz-001', 'q-002', 1);

-- ─── Sample Flashcard Set ────────────────────────────────────
INSERT OR IGNORE INTO flashcard_sets (id, title, description, book_id, chapter_id, card_count, status, created_by) VALUES
  ('fc-001', 'Physics Motion Concepts', 'Key concepts from kinematics', 'book-001', 'ch-001-02', 3, 'PUBLISHED', 'admin-001');

INSERT OR IGNORE INTO flashcards (id, set_id, front_text, back_text, display_order) VALUES
  ('fcard-001', 'fc-001', 'What is displacement?', 'Displacement is the shortest distance between the initial and final position of an object, with direction. It is a vector quantity.', 0),
  ('fcard-002', 'fc-001', 'What is the difference between speed and velocity?', 'Speed is a scalar quantity (magnitude only), while velocity is a vector quantity (magnitude + direction). Speed = distance/time, Velocity = displacement/time.', 1),
  ('fcard-003', 'fc-001', 'What are the equations of motion?', 'v = u + at; s = ut + ½at²; v² = u² + 2as; where u = initial velocity, v = final velocity, a = acceleration, t = time, s = displacement.', 2);

-- ─── App Config ──────────────────────────────────────────────
INSERT OR IGNORE INTO app_config (key, value, description) VALUES
  ('app_name', '"TF Study Shelf"', 'Application name'),
  ('app_tagline', '"Read. Learn. Remember."', 'Application tagline'),
  ('app_version', '"1.0.0"', 'Current app version'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('max_offline_hours', '24', 'Maximum offline access duration in hours'),
  ('min_app_version', '"1.0.0"', 'Minimum supported app version');
