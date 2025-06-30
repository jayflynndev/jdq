import Link from "next/link";

interface HomeCardProps {
  title: string;
  description: string;
  href: string;
}

export default function HomeCard({ title, description, href }: HomeCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-md hover:bg-white/30 transition cursor-pointer">
        <h3 className="text-xl font-bold text-yellow-300 mb-2">{title}</h3>
        <p className="text-white">{description}</p>
      </div>
    </Link>
  );
}
