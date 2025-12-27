import Link from "next/link";

export default function Home() {
  return (
    <main>
        <div className="center">Welcome to Gradus</div>
        <Link href="/"><div className="center">Login here</div></Link>
    </main>
  );
}