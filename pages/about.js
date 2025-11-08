import Navbar from '../components/Navbar';

export default function AboutUs() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16 text-gray-800">
        <h1 className="text-4xl font-bold text-center mb-10">About MindMirror3D</h1>

        <section className="mb-10">
          <p className="text-lg mb-4">
            MindMirror3D was founded on a simple yet powerful idea: to transform introspection into art. We believe that self-awareness is a journey, and visualizing your personality can make that journey more meaningful and memorable.
          </p>
          <p className="text-lg mb-4">
            By combining psychological insights with symbolic design, we turn the results of two well-established personality assessments—the Big Five and Basic Needs test—into custom 3D-printed sculptures. Each piece is accompanied by a beautifully crafted booklet explaining how your traits shape the design.
          </p>
          <p className="text-lg">
            Whether you're seeking deeper self-understanding or a meaningful gift, your sculpture is a reflection of your inner world—unique, intentional, and deeply personal.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-lg">
            To bridge the gap between psychology and tangible expression—empowering people to see themselves with clarity, compassion, and creativity.
          </p>
        </section>
      </main>
    </>
  );
}
