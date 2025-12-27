import Link from "next/link";

export default function Home() {
  return (
    <main>
        <Link href="/">Home </Link>
        <Link href="/">Check-in </Link>
        <Link href="/">My Goals </Link>
        <Link href="/">Settings </Link>
        <Link href="/about">About </Link>
    </main>
  );
}