import { permanentRedirect } from 'next/navigation';

// The About page was merged into the landing page (T-098). Old links land on its how-it-works story.
export default function About() {
  permanentRedirect('/#how-it-works');
}
