-- Migrate Stanford Tournament Competition data to Supabase
-- Based on: stanford_tournament_competition_april_2024_v1.json

-- Insert document record
INSERT INTO documents (
  id, school, course, problem_type, term, year, total_problems, total_images
) VALUES (
  'stanford_tournament_competition_april_2024',
  'stanford',
  'tournament', 
  'competition',
  'april',
  '2024',
  10,
  2
) ON CONFLICT (id) DO UPDATE SET
  total_problems = EXCLUDED.total_problems,
  total_images = EXCLUDED.total_images,
  updated_at = NOW();

-- Insert problems (based on JSON data)
INSERT INTO problems (
  id, doc_id, problem_text, correct_answer, solution, images, difficulty, topics, manually_saved
) VALUES 
(
  'stanford_tournament_competition_april_2024_p1',
  'stanford_tournament_competition_april_2024',
  'Compute \[ \lim _{x \rightarrow \infty} \frac{\int_{0}^{x} e^{t^{2}} d t}{e^{x^{2}}} \]',
  '0',
  'Since both the numerator and denominator go to \( +\infty \) in the limit, we can apply L''Hopital''s Rule: \[ \begin{aligned} \lim _{x \rightarrow \infty} \frac{\int_{0}^{x} e^{t^{2}} d t}{e^{x^{2}}} & =\lim _{x \rightarrow \infty} \frac{\frac{d}{d x} \int_{0}^{x} e^{t^{2}} d t}{\frac{d}{d x} e^{x^{2}}} & =\lim _{x \rightarrow \infty} \frac{1}{2 x} \\ & =0 \end{aligned} \]',
  ARRAY[]::TEXT[],
  'hard',
  ARRAY[16],
  true
),
(
  'stanford_tournament_competition_april_2024_p2',
  'stanford_tournament_competition_april_2024',
  'Consider the region specified by the union of the inequalities \( 1 \geq y \geq x^{2} \) and \( 1 \geq x \geq y^{2} \). What is the volume of the solid created by rotating this region about the \( x \)-axis?',
  '\[ \frac{9 \pi}{5} \]',
  'By graphing the inequalities, note that the solid consists of a cylinder for \( x \geq 0 \) and the solid formed by rotating \( 1 \geq y \geq x^{2} \) for \( x<0 \). The volume of the cylinder is \( \pi \), so it remains to find the volume of the second solid. The second solid has volume \( \pi \int_{-1}^{0} 1-\left(x^{2}\right)^{2} \mathrm{~d} x=\pi\left(x-\frac{1}{5} x^{5}| |_{-1}^{0}\right)=\frac{4 \pi}{5} \), so our final answer is \( \pi+\frac{4 \pi}{5}= \) \( \frac{9 \pi}{5} \). ![p2_2.png]',
  ARRAY[]::TEXT[],
  'hard',
  ARRAY[3],
  true
),
(
  'stanford_tournament_competition_april_2024_p3',
  'stanford_tournament_competition_april_2024',
  'Compute the limit \[ \lim _{x \rightarrow 0} \frac{g^{\prime}(x)}{x^{6}}, \text { where } g(x)=\int_{0}^{x^{4}} \frac{x t e^{\frac{t}{x}}}{x^{2}+t^{2}} d t \]',
  '\[ \frac{7}{2} \]',
  'Observe that \[ g(x)=\frac{1}{x} \int_{0}^{x^{4}} \frac{t e^{\frac{t}{x}}}{1+\left(\frac{t}{x}\right)^{2}} d t=\int_{0}^{x^{3}} \frac{(u x) e^{u}}{1+u^{2}} d u \] Then by the product rule and FTC, \[ g^{\prime}(x)=x\left(\frac{x^{3} e^{x^{3}}}{1+x^{6}}\right) 3 x^{2}+\int_{0}^{x^{3}} \frac{u e^{u}}{1+u^{2}} d u \] So our limit is \[ \lim _{x \rightarrow 0} \frac{g^{\prime}(x)}{x^{6}}=\lim _{x \rightarrow 0}\left(\frac{3 e^{x^{3}}}{1+x^{6}}+\frac{1}{x^{6}} \int_{0}^{x^{3}} \frac{u e^{u}}{1+u^{2}} d u\right) \] Our second term requires L''Hopital''s rule: \[ 3+\lim _{x \rightarrow 0} \frac{1}{6 x^{5}} \cdot \frac{x^{3} e^{x^{3}} \cdot 3 x^{2}}{1+x^{6}}=3+\frac{1}{2}=\frac{7}{2} . \]',
  ARRAY[]::TEXT[],
  'hard',
  ARRAY[39],
  true
),
(
  'stanford_tournament_competition_april_2024_p4',
  'stanford_tournament_competition_april_2024',
  'Consider the pair of ladders shown in the below image. The bottom ladder (dashed line) connects the points \( (0,4) \) and \( (4,0) \). The top ladder (dotted line) is attached to the bottom ladder at \( (2,2) \) and touches the wall at \( (0,6) \). This pair of ladders begins to slide down the wall, such that the top ladder remains attached to the midpoint of the bottom ladder. When the bottom ladder touches the wall at the point \( (0,2) \), the end at which it touches the wall is moving downward at the rate of 2 units per second. At that point in time, what is the rate at which the wall end of the top ladder is moving downward, in units per second? ![p4_2.png]',
  '\[ \frac{13+\sqrt{13}}{13} \]',
  'Note that the bottom ladder has length \( 4 \sqrt{2} \). Thus, when it is touching the wall at \( (0,2 y) \) (for convenience), the other end of the ladder must be at \( \left(2 \sqrt{8-y^{2}}, 0\right) \). This implies that the midpoint of this ladder is at the point \( \left(\sqrt{8-y^{2}}, y\right) \). Furthermore, the length of the top ladder is \( \sqrt{4^{2}+2^{2}}=\sqrt{20} \). This implies that the top ladder touches the wall at the point \( \left(0, y+\sqrt{12+y^{2}}\right) \). Define \( f(y)=y+\sqrt{12+y^{2}} \). We are given that \( \frac{\mathrm{d} 2 y}{\mathrm{~d} t}=2 \), so \( \frac{\mathrm{d} y}{\mathrm{~d} t}=1 \). Now, we may compute that \[ \frac{\mathrm{d} f(y)}{\mathrm{d} t}=\frac{\mathrm{d} y}{\mathrm{~d} t}\left(1+\frac{y}{\sqrt{12+y^{2}}}\right)=1+\frac{1}{\sqrt{13}}=\frac{13+\sqrt{13}}{13} . \]',
  ARRAY['p4_2.png'],
  'medium',
  ARRAY[17],
  true
),
(
  'stanford_tournament_competition_april_2024_p5',
  'stanford_tournament_competition_april_2024',
  'Charlie chooses a real number \( c>0 \). Bob chooses a real number \( b \) from the inteval \( (0,2 c) \) uniformly at random. Alice chooses a real number \( \tilde{a} \) from the interval \( (0,2 \sqrt{c}) \) uniformly at random. Let \( a=\tilde{a}^{2} \). What is the probability that the roots of \( a x^{2}+b x+c \) have nonzero imaginary parts and have real parts with absolute value greater than 1 ?',
  '\( \frac{1}{12} \)',
  'Notice that \( a, b, c>0 \). If the quadratic has roots with nonzero imaginary parts, then \( b^{2}<4 a c \). If these complex roots have real parts with absolute value greater than 1, then \( b>2 a \). Hence, we need \( 2 a<b<2 \sqrt{a c} \). If \( a \geq c \), then this is impossible, and this occurs with probability half. Conditioned on a fixed \( a<c \), the probability that \( 2 a<b<2 \sqrt{a c} \), given that \( b \) is drawn uniformly from \( (0,2 c) \), is \( \frac{2 \sqrt{a c}-2 a}{2 c}=\frac{\sqrt{a c}-a}{c} \). Let \( p=\frac{a^{\prime}}{\sqrt{c}} \) so that \( \frac{\sqrt{a c}-a}{c}=p(1-p) \). Notice that when \( a<c, p \) is chosen uniformly at random from \( (0,1) \), so we need to integrate \( p(1-p) \) from 0 to 1, which gives us \( \frac{1}{6} \). Thus, our final answer is \( \frac{1}{2} \cdot \frac{1}{6}=\frac{1}{12} \).',
  ARRAY[]::TEXT[],
  'very_hard',
  ARRAY[1],
  true
),
(
  'stanford_tournament_competition_april_2024_p6',
  'stanford_tournament_competition_april_2024',
  'Let \( f_{0}(x)=\max (|x|, \cos (x)) \), and \( f_{k+1}(x)=\max \left(|x|-f_{k}(x), f_{k}(x)-\cos (x)\right) \). Compute \[ \lim _{n \rightarrow \infty} \int_{-\pi / 2}^{\pi / 2}\left(f_{n-1}(x)+f_{n}(x)\right) d x \]',
  '\( \frac{\pi^{2}}{4} \)',
  'For every \( x \in\left(-\frac{\pi}{2}, \frac{\pi}{2}\right) \), we have \( \cos (x)>0 \), so there exists some integer \( j \) such that \( |x|<(2 j+1) \cos (x) \) and \( |x| \geq(2 j-1) \cos (x) \). When \( j=0 \), we have \( f_{0}(x)=\cos (x), f_{1}(x)= \) \( 0, f_{2}(x)=|x|, f_{3}(x)=0 \), so we see that for \( k \geq 1, f_{k}(x)+f_{k+1}(x)=|x| \). For \( j>0 \), we observe that \( f_{j}(x)=|x|-j \cos (x) \) for \( j \leq k \), and then \( f_{k+1}(x)=k \cos (x), f_{k+2}(x)=|x|- \) \( k \cos (x), f_{k+3}(x)=k \cos (x) \), so we see that for \( j>k \), we have \( f_{j}(x)+f_{j+1}(x)=|x| \). We have shown that \( f_{n-1}+f_{n}(x) \) converges pointwise to \( |x| \) for \( x \in\left(-\frac{\pi}{2}, \frac{\pi}{2}\right) \). We can exchange the limit and integral in the desired expression since \( f_{n-1}+f_{n}(x) \) is bounded above and below. Thus, \[ \begin{aligned} \lim _{n \rightarrow \infty} \int_{-\pi / 2}^{\pi / 2}\left(f_{n-1}(x)+f_{n}(x)\right) d x & =\int_{-\pi / 2}^{\pi / 2} \lim _{n \rightarrow \infty}\left(f_{n-1}(x)+f_{n}(x)\right) d x & =2 \int_{0}^{\pi / 2} x d x \\ & =\frac{\pi^{2}}{4} \end{aligned} \]',
  ARRAY[]::TEXT[],
  'medium',
  ARRAY[29],
  true
),
(
  'stanford_tournament_competition_april_2024_p7',
  'stanford_tournament_competition_april_2024',
  'If \( f(x) \) is a non-negative differentiable function defined over positive real numbers that satisfies \( f(1)=\frac{25}{16} \) and \[ f^{\prime}(x)=2 x^{-1} f(x)+x^{2} \sqrt{f(x)} \] compute \( f(2) \)',
  '16',
  'We divide by \( 2 \sqrt{f(x)} \) on both sides of the differential equation to get \[ \frac{f^{\prime}(x)}{2 \sqrt{f(x)}}-\frac{\sqrt{f(x)}}{x}=\frac{x^{2}}{2} \] We let \( v(x)=\sqrt{f(x)} \), so \( v^{\prime}(x)=\frac{1}{2 \sqrt{f(x)}} f^{\prime}(x) \), and the equation becomes \( v^{\prime}(x)-\frac{v(x)}{x}=\frac{x^{2}}{2} \). Dividing both sides by \( x \) gives us \( \frac{v^{\prime}(x)}{x}-\frac{v(x)}{x^{2}}=\frac{x}{2} \). Using the product rule, we note that this is equivalent to \( \left(\frac{v(x)}{x}\right)^{\prime}=\frac{x}{2} \). Integrating both sides gives us \[ \frac{v(x)}{x}=\frac{x^{2}}{4}+c \] for some constant \( c \). Thus, we have \( \sqrt{f(x)}=\frac{x^{3}}{4}+c x \). The condition \( f(1)=\frac{25}{16} \) gives us \( \frac{1}{4}+c=\frac{5}{4} \) (note that \( f(x) \) is non-negative, so there is really only one possible value). Then, our answer is \( f(2)=(2+2)^{2}=16 \).',
  ARRAY[]::TEXT[],
  'medium',
  ARRAY[20],
  true
),
(
  'stanford_tournament_competition_april_2024_p8',
  'stanford_tournament_competition_april_2024',
  'Compute \[ \int_{0}^{1} \cos \left(\frac{\pi}{4}+\frac{10^{4}-1}{2} \arccos (x)\right) d x \]',
  '\[ -\frac{2 \sqrt{2}}{99979997} \]',
  'Let the value of this integral be \( I \), and set \( a=\frac{10^{4}-1}{2} \). Substituting \( x=\cos (u) \) and hence \( \mathrm{d} x=-\sin (u) \mathrm{d} u \) gives \[ I=\int_{0}^{\frac{\pi}{2}} \cos \left(\frac{\pi}{4}+a u\right) \sin (u) \mathrm{d} u=\int_{0}^{\frac{\pi}{2}} \cos \left(\frac{\pi}{4}+a x\right) \sin (x) \mathrm{d} x \] We integrate by parts twice: \[ \begin{array}{l} \int_{0}^{\frac{\pi}{2}} \cos \left(\frac{\pi}{4}+a x\right) \sin (x) \mathrm{d} x =\frac{\sqrt{2}}{2}-a \int_{0}^{\frac{\pi}{2}} \sin \left(\frac{\pi}{4}+a x\right) \cos (x) \mathrm{d} x =\frac{\sqrt{2}}{2}-a \sin \left(\frac{\pi}{4}+\frac{a \pi}{2}\right)+a^{2} \int_{0}^{\frac{\pi}{2}} \cos \left(\frac{\pi}{4}+a x\right) \sin (x) \mathrm{d} x \end{array} \] Solving this gives \[ I=\frac{a \sin \left(\frac{\pi}{4}+\frac{a \pi}{2}\right)-\frac{\sqrt{2}}{2}}{a^{2}-1} \] As \( 10^{4}-1 \equiv 3 \bmod 4 \), then \( \sin \left(\frac{\pi}{4}+\frac{\left(10^{4}-1\right) \pi}{4}\right)=0 \). Hence, we have \[ I=\frac{-\frac{\sqrt{2}}{2}}{\frac{\left(10^{4}-1\right)^{2}}{4}-1}=-\frac{2 \sqrt{2}}{\left(10^{4}-3\right)\left(10^{4}+1\right)}=-\frac{2 \sqrt{2}}{99979997} \text {. } \] An alternative solution would be to directly use the product-to-sum formulas for cos.',
  ARRAY[]::TEXT[],
  'easy',
  ARRAY[39],
  true
),
(
  'stanford_tournament_competition_april_2024_p9',
  'stanford_tournament_competition_april_2024',
  'The integral \( \int_{0}^{f(2024)} f^{-1}(x) d x \), where \( f(x)=\int_{0}^{x} e^{-t^{2}} d t \), can be written in the form \( A\left(1-e^{-B}\right) \) for positive rational constants \( A \) and \( B \). Compute \( A+\left\lfloor\log _{10} B\right\rfloor \)',
  '\[ {\frac{13}{2}}  \]',
  'Applying Laisant''s Technique, we know that \[ \int_{0}^{f(2024)} f^{-1}(x) \mathrm{d} x=2024 f(2024)-\int_{0}^{2024} f(x) \mathrm{d} x \] Unfortunately, \( f(x) \) (and thus \( f(2024) \) ) do not have closed forms. So, we try to rearrange the right hand side. To do so, by Fubini''s Theorem we obtain that \[ \begin{aligned} \int_{0}^{2024} f(x) \mathrm{d} x & =\int_{0}^{2024} \int_{0}^{x} e^{-t^{2}} \mathrm{~d} t \mathrm{~d} x & =\int_{0}^{2024}(2024-t) e^{-t^{2}} \mathrm{~d} t & =2024 f(2024)+\left(\left.\frac{1}{2} e^{-t^{2}}\right|_{t=0} ^{2024}\right) \\ & =2024 f(2024)-\frac{1}{2}\left(1-e^{-2024^{2}}\right) \end{aligned} \] Thus, \[ \int_{0}^{f(2024)} f^{-1}(x) \mathrm{d} x=\frac{1}{2}\left(1-e^{-2024^{2}}\right) \] Therefore, \( A=\frac{1}{2}, B=2024^{2} \). This gives \( A+\left\lfloor\log _{10} B\right\rfloor=\frac{1}{2}+6=\boxed{\frac{13}{2}} \). Alternate solution: Let us attempt to get rid of the inverse (which is quite difficult to integrate) by making the substitution \( w=f^{-1}(x) \Longrightarrow x=f(w) \Longrightarrow d x=f^{\prime}(w) d w \). This yields \( \int_{0}^{f(2024)} f^{-1}(x) d x=\int_{0}^{2024} w f^{\prime}(w) d w \). This is much easier to integrate as \( f^{\prime}(w)= \) \( \frac{d}{d w} \int_{2024}^{w} e^{-t^{2}} d t=e^{-w^{2}} \) by the Fundamental Theorem of, so \( \int_{0}^{2024} w f^{\prime}(w) d w= \) \( \int_{0}^{2024} w e^{-w^{2}} d w \). This is readily evaluated by \( u \)-substitution to yield \( -\left.\frac{1}{2} e^{-w^{2}}\right|_{0} ^{2024}=\frac{1}{2}(1- \) \( \left.e^{-2024^{2}}\right) \). Therefore, \( A=1 / 2 \) and \( B=2024^{2} \). We compute that \( 1000^{2}=10^{6} \) and \( 3000^{2}=9 \times 10^{6} \) both have 7 digits, so \( \left\lfloor\log _{10} 2024^{2}\right\rfloor+1=7 \Longrightarrow A+\left\lfloor\log _{10} B\right\rfloor=\boxed{\frac{13}{2}} \).',
  ARRAY[]::TEXT[],
  'very_hard',
  ARRAY[1],
  true
),
(
  'stanford_tournament_competition_april_2024_p10',
  'stanford_tournament_competition_april_2024',
  'Compute \[ \sum_{m=0}^{\infty} \sum_{n=0}^{\infty} \frac{\left(\frac{1}{4}\right)^{m+n}}{(2 n+1)(m+n+1)} \]',
  '\[ \ln ^{2}(3) \]',
  'We have \[ \sum_{m=0}^{\infty} \sum_{n=0}^{\infty} \frac{4\left(\frac{1}{4}\right)^{m+n+1}}{(2 n+1)(m+n+1)}=\sum_{m=0}^{\infty} \sum_{n=0}^{\infty} \frac{4}{2 n+1} \int_{0}^{\frac{1}{4}} x^{m+n} d x \] Now, using \( \tanh ^{-1}(x)=\frac{1}{2} \ln \left(\frac{1+x}{1-x}\right)=\sum_{n=0}^{\infty} \frac{x^{2 n+1}}{2 n+1} \), we get that \[ \begin{aligned} \sum_{m=0}^{\infty} \sum_{n=0}^{\infty} \frac{8\left(\frac{1}{2}\right)^{2 m+2 n+2}}{(2 n+1)(2 m+2 n+2)} & =\sum_{m=0}^{\infty} \sum_{n=0}^{\infty} \frac{8}{2 n+1} \int_{0}^{\frac{1}{2}} x^{2 m+2 n+1} d x & =8 \int_{0}^{\frac{1}{2}} \frac{\tanh ^{-1}(x)}{1-x^{2}} d x \\ & =\ln ^{2}(3) \end{aligned} \]',
  ARRAY[]::TEXT[],
  'hard',
  ARRAY[30],
  true
)
ON CONFLICT (id) DO UPDATE SET
  problem_text = EXCLUDED.problem_text,
  correct_answer = EXCLUDED.correct_answer,
  solution = EXCLUDED.solution,
  images = EXCLUDED.images,
  difficulty = EXCLUDED.difficulty,
  topics = EXCLUDED.topics,
  manually_saved = EXCLUDED.manually_saved,
  updated_at = NOW();

-- Note: No subproblems to insert as all subproblems fields are empty in this JSON

-- Verify the insertion
SELECT 'Documents' as table_name, COUNT(*) as count FROM documents
UNION ALL
SELECT 'Problems' as table_name, COUNT(*) as count FROM problems
UNION ALL  
SELECT 'Subproblems' as table_name, COUNT(*) as count FROM subproblems;