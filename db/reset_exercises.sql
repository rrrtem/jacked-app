-- ============================================
-- RESET EXERCISES TABLE
-- ============================================

TRUNCATE TABLE exercises RESTART IDENTITY CASCADE;

INSERT INTO exercises (name, instructions, tags)
VALUES
  (
    'Deadlift',
    'Stand tall with your midfoot under the bar, brace your core, and drive through your legs until the bar reaches hip height. Kid-friendly: Pretend you are lifting a treasure chest; keep your back flat like a table and push the floor away until you are standing tall.',
    ARRAY['barbell','pull','posterior-chain','full-body','weight','complex']
  ),
  (
    'Romanian Deadlift',
    'Push your hips back while keeping the bar close to your legs, lower until you feel a hamstring stretch, then stand tall by squeezing your glutes. Kid-friendly: Imagine closing a car door with your backside, keep the bar sliding on your legs, and stand up like a proud superhero.',
    ARRAY['barbell','pull','posterior-chain','hamstrings','weight','complex']
  ),
  (
    'Sumo Deadlift',
    'Take a wide stance, grip the bar inside your knees, brace, and push the floor away until your hips and shoulders rise together. Kid-friendly: Think of being a sumo wrestler; push the ground down with your feet and stand tall while hugging the bar.',
    ARRAY['barbell','pull','legs','posterior-chain','weight','complex']
  ),
  (
    'Bench Press',
    'Lie on the bench, pull your shoulder blades together, lower the bar to mid-chest, and press it straight up. Kid-friendly: Picture squeezing oranges under your shoulder blades, tap the bar on your shirt logo, and push it up like launching a rocket.',
    ARRAY['barbell','push','chest','triceps','weight','complex']
  ),
  (
    'Incline Bench Press',
    'Set the bench to a slight incline, lower the bar toward your upper chest, and press it up while keeping your wrists stacked. Kid-friendly: Pretend you are pushing a heavy door up a hill, touch it gently to your collar, and shove it back to the sky.',
    ARRAY['barbell','push','chest','shoulders','weight','complex']
  ),
  (
    'Overhead Press',
    'Stand with the bar at your shoulders, squeeze your glutes, and press it overhead without leaning back. Kid-friendly: Squeeze your belly tight, push the bar up like placing a book on a tall shelf, and finish with your arms by your ears.',
    ARRAY['barbell','push','shoulders','triceps','weight','complex']
  ),
  (
    'Push Press',
    'Dip your knees slightly, drive the bar upward with your legs, and finish locking it overhead. Kid-friendly: Bounce like a spring, pop the bar up with your legs, and hold it overhead like sheltering under an umbrella.',
    ARRAY['barbell','push','full-body','shoulders','weight','complex']
  ),
  (
    'Front Squat',
    'Rest the bar on your front shoulders, keep elbows high, sit between your hips, and drive up through midfoot. Kid-friendly: Make a shelf with your shoulders for the bar, keep your elbows pointing forward, and sit like on an invisible chair before standing up.',
    ARRAY['barbell','legs','core','weight','complex']
  ),
  (
    'Back Squat',
    'Set the bar across your upper back, brace your core, sit your hips back and down, then stand by pushing through your heels. Kid-friendly: Hug the bar with your back, sit like you are lowering onto a beanbag, and stand up by pushing the floor away.',
    ARRAY['barbell','legs','glutes','weight','complex']
  ),
  (
    'Barbell Lunge',
    'Step forward under control, lower until your back knee hovers above the floor, and push through the front foot to return. Kid-friendly: Take a big superhero step, gently tap your back knee toward the ground, and push yourself back like bouncing off a trampoline.',
    ARRAY['barbell','legs','glutes','balance','weight','complex']
  ),
  (
    'Barbell Split Squat',
    'Take a stable split stance, drop your back knee straight down, then drive up through the front leg while keeping the bar steady. Kid-friendly: Freeze with one foot in front, bend down like taking a knee, and spring back up while the bar stays calm.',
    ARRAY['barbell','legs','glutes','core','weight','complex']
  ),
  (
    'Barbell Row',
    'Hinge from the hips, keep your back flat, pull the bar toward your lower ribs, and lower it under control. Kid-friendly: Make your back like a tabletop, row the bar to your belly button, and set it down softly without wobbling.',
    ARRAY['barbell','pull','back','biceps','weight','complex']
  ),
  (
    'Barbell Pendlay Row',
    'Start with your torso parallel to the floor, pull the bar explosively to your chest, and place it back on the ground each rep. Kid-friendly: Pretend you are starting a lawn mower, tug the bar to your ribs fast, and let it rest on the floor before the next pull.',
    ARRAY['barbell','pull','back','power','weight','complex']
  ),
  (
    'Barbell Curl',
    'Stand tall, keep your elbows pinned to your sides, curl the bar up, and lower it slowly. Kid-friendly: Glue your elbows to your ribs, bend your arms to show your muscles, and lower the bar like it is made of glass.',
    ARRAY['barbell','pull','biceps','weight','isolate']
  ),
  (
    'Barbell Hip Thrust',
    'Rest your upper back on a bench, roll the bar over your hips, drive through your heels, and squeeze your glutes at the top. Kid-friendly: Push the bar up like popping your hips to the clouds, hold a big squeeze, and lower down like a slow elevator.',
    ARRAY['barbell','glutes','posterior-chain','weight','complex']
  ),
  (
    'Barbell Good Morning',
    'With the bar on your upper back, hinge at the hips with a slight knee bend, then stand tall by engaging hamstrings and glutes. Kid-friendly: Bow forward like a polite knight, keep your back strong, and stand back up tall without rushing.',
    ARRAY['barbell','posterior-chain','hamstrings','weight','complex']
  ),
  (
    'Barbell Shrug',
    'Hold the bar at your thighs, keep your arms straight, lift your shoulders toward your ears, and lower under control. Kid-friendly: Pretend you are saying you do not know with extra strong shoulders, shrug up to your ears, and let them drop slowly.',
    ARRAY['barbell','upper-back','traps','weight','isolate']
  ),
  (
    'Barbell Clean',
    'Pull the bar from the floor, extend powerfully through your hips, and catch it on your shoulders in a quick front rack. Kid-friendly: Jump the bar up like popping toast, zip your elbows under fast, and land soft with the bar hugging your shoulders.',
    ARRAY['barbell','power','full-body','weight','complex']
  ),
  (
    'Barbell Thruster',
    'Perform a front squat, drive up strongly, and continue pressing the bar overhead in one fluid motion. Kid-friendly: Squat like you are sitting on a rocket, blast up, and push the bar to the stars in one smooth move.',
    ARRAY['barbell','full-body','push','conditioning','weight','complex']
  ),
  (
    'Barbell Overhead Squat',
    'Lock the bar overhead, sit your hips down between your heels, and stand up while keeping the bar stable. Kid-friendly: Stretch the bar wide above your head, squat like a surfer hiding under a wave, and stand tall without letting the bar wobble.',
    ARRAY['barbell','legs','shoulders','core','weight','complex']
  ),
  (
    'Assisted Pull-Ups',
    'Use a band or machine for help, pull your chest toward the bar, and lower with control. Kid-friendly: Let the band help you like a buddy boost, pull yourself up to see over a fence, and slide down slow like on a pole.',
    ARRAY['bodyweight','pull','back','biceps','complex']
  ),
  (
    'Pull-Ups',
    'Hang from the bar with straight arms, pull your chin over the bar, and lower until your arms are long again. Kid-friendly: Hang like a monkey, pull yourself up to peek over the wall, and go back down like a slow elevator.',
    ARRAY['bodyweight','pull','back','biceps','complex']
  ),
  (
    'Regular Push-Ups',
    'Keep your body in a straight line, lower your chest to the floor, and press back up without sagging. Kid-friendly: Make your body a stiff plank, touch your chest to the ground like giving it a quick boop, and push back up strong.',
    ARRAY['bodyweight','push','chest','triceps','complex']
  ),
  (
    'Narrow Push-Ups',
    'Place your hands under your shoulders, tuck your elbows close, lower your chest, and press up focusing on triceps. Kid-friendly: Keep your hands like train tracks under you, lower down while keeping elbows glued, and push up to show off your arm strength.',
    ARRAY['bodyweight','push','triceps','core','complex']
  ),
  (
    'Wide Push-Ups',
    'Spread your hands wider than shoulders, lower your chest between them, and press up while keeping your core tight. Kid-friendly: Put your hands wide like a starfish, drop your chest between them, and push the floor away like it is a big drum.',
    ARRAY['bodyweight','push','chest','shoulders','complex']
  ),
  (
    'Dips',
    'Support yourself on parallel bars, lower until your elbows reach about ninety degrees, and press back up until your arms are straight. Kid-friendly: Hold yourself up like a strong statue, bend your elbows like you are dipping into a pool, and push back up tall.',
    ARRAY['bodyweight','push','chest','triceps','complex']
  ),
  (
    'Handstand Hold',
    'Kick up to a wall, stack your body in a straight line, and keep tension while breathing steadily. Kid-friendly: Go upside down like walking on the ceiling, squeeze your tummy and legs, and hold still as if you are a frozen statue.',
    ARRAY['bodyweight','skill','shoulders','core','duration']
  ),
  (
    'Wall Walk',
    'Start in a plank with feet on the wall, walk your hands back as your feet climb until your chest nears the wall, then return with control. Kid-friendly: Crawl your feet up the wall like Spider-Man, walk your hands toward the wall, and come back down slowly without crashing.',
    ARRAY['bodyweight','skill','shoulders','core','complex']
  ),
  (
    'Jumping Jacks × 30s',
    'Jump your feet out while swinging arms overhead, then return to start and repeat rhythmically for 30 seconds. Kid-friendly: Jump like a star popping open and closed, clap your hands overhead, and land softly each time.',
    ARRAY['warm','full-body','cardio']
  ),
  (
    'High Knees × 30s',
    'Jog in place lifting your knees toward hip height quickly for 30 seconds while pumping your arms. Kid-friendly: Run on the spot like the floor is lava, drive your knees up to your hands, and keep moving fast.',
    ARRAY['warm','cardio','legs']
  ),
  (
    'Butt Kicks × 30s',
    'Jog in place kicking your heels toward your glutes for 30 seconds while swinging your arms for balance. Kid-friendly: Jog like you are trying to kick your own backside, tap your hands with your heels, and keep smiling.',
    ARRAY['warm','cardio','legs']
  ),
  (
    'Arm Circles 2×15',
    'Extend your arms to the sides, rotate forward for 15 smooth circles and backward for 15 more. Kid-friendly: Stretch your arms like airplane wings, draw tiny circles that grow into big ones, and keep your shoulders relaxed.',
    ARRAY['warm','shoulders','mobility']
  ),
  (
    'Leg Swings ×10/leg',
    'Hold onto support, swing one leg forward and back for 10 controlled reps before switching legs. Kid-friendly: Grip a rail, swing your leg like a friendly pendulum, and swap legs without wobbling.',
    ARRAY['warm','legs','mobility']
  ),
  (
    'Hip Circles 2×10',
    'Place hands on hips, draw big circles for 10 reps each direction to loosen the joints. Kid-friendly: Pretend you are spinning a hula hoop, move your hips in slow circles, and switch directions like a dance.',
    ARRAY['warm','hips','mobility']
  ),
  (
    'Cat-Cow Stretch 2×8',
    'On hands and knees, alternate arching and dipping your spine for two sets of eight slow breathing cycles. Kid-friendly: Move like a happy cow and a scared cat, round your back high then let it sink low, and do eight gentle wiggles, rest, then eight more.',
    ARRAY['warm','spine','mobility']
  ),
  (
    'Inchworm Walkouts ×6',
    'Fold at the hips, walk your hands out to a plank, pause, and walk your feet toward your hands for 6 total walkouts. Kid-friendly: Bend down like touching your toes, crawl your hands forward like a worm, then tiptoe your feet in to stand up tall.',
    ARRAY['warm','full-body','mobility']
  ),
  (
    'Scapular Push-Ups 2×10',
    'Hold a plank with arms straight, pinch your shoulder blades together, then push the floor away for two sets of ten smooth pulses with a short pause between sets. Kid-friendly: Stay in a strong plank, squeeze your shoulder blades like you are holding a pencil, do ten little pushes, rest for a breath, then ten more.',
    ARRAY['warm','shoulders','stability']
  ),
  (
    'Glute Bridge March ×10/side',
    'Lift your hips into a bridge and alternate marching each knee toward your chest for 10 reps per side. Kid-friendly: Lift your hips like a bridge, march one knee up at a time without letting the bridge fall, and keep breathing.',
    ARRAY['warm','glutes','core']
  ),
  (
    'Monster Walks 2×10 steps',
    'Place a band around your legs, sink into a slight squat, and step sideways for 10 steps each direction while keeping tension. Kid-friendly: Put the band on like monster cuffs, crouch like sneaking, and waddle sideways without letting the band fall.',
    ARRAY['warm','glutes','hips']
  ),
  (
    'PVC Pass-Throughs ×12',
    'Hold a dowel with a wide grip, keep arms straight, and rotate it from hips to back overhead for 12 smooth reps. Kid-friendly: Use the stick like a rainbow, swing it from your thighs over your head to your backside, and keep your arms long like spaghetti.',
    ARRAY['warm','shoulders','mobility']
  ),
  (
    'World''s Greatest Stretch ×4/side',
    'Step into a deep lunge, place both hands inside the front foot, rotate your torso toward the front leg, and alternate sides for 4 lunges each way. Kid-friendly: Lunge forward like a superhero landing, reach one hand up to wave at the sky, and swap legs to explore both sides.',
    ARRAY['warm','hips','full-body']
  ),
  (
    'Ankle Bounces 2×20',
    'Stand tall and perform quick, small bounces using only your ankles for two sets of twenty pulses, pausing briefly between sets. Kid-friendly: Pretend the floor is a tiny trampoline, bounce on your tiptoes without bending your knees, count to twenty, take a breath, and count to twenty again.',
    ARRAY['warm','ankles','mobility']
  );

