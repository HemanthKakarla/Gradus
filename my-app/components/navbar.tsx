import Link from "next/link";

export default function Home() {
  return (
    <main>
      <nav className="navbar">
          {/* <a>Home</a>
          <a>Check-in</a>
          <a>My Goals</a>
          <a>Settings</a>
          <span>😊</span> */}
        <Link href="/">Home </Link>
        <Link href="/">Check-in </Link>
        <Link href="/">My Goals </Link>
        <Link href="/">Settings </Link>
        <Link href="/about">About </Link>
        </nav>
    </main>
  );
}