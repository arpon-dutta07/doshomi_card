import Link from "next/link";

export function BrokenLetter() {
  return (
    <main className="broken saree-bg">
      <div>
        <p className="gate-big">চিঠিটা খুলছে না</p>
        <p className="gate-small">Link-টা পুরোটা copy হয়নি মনে হয়। যে পাঠিয়েছে তাকে আরেকবার পাঠাতে বলো।</p>
        <p style={{ marginTop: 18 }}>
          <Link className="btn" href="/">
            Write your own
          </Link>
        </p>
      </div>
    </main>
  );
}
