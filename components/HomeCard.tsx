import Link from "next/link";
import { ReactNode } from "react";

interface HomeCardProps {
  title: string;
  description: string;
  href: string;
  icon?: ReactNode; // Optional: Pass an icon or image component
}

export default function HomeCard({
  title,
  description,
  href,
  icon,
}: HomeCardProps) {
  return (
    <Link href={href} passHref>
      <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl p-6 shadow-lg transition hover:shadow-xl hover:scale-[1.03] cursor-pointer border-2 border-purple-300 hover:border-purple-500">
        <div className="flex flex-col items-center justify-center space-y-4 text-center h-full">
          {icon && <div className="text-purple-700 text-4xl">{icon}</div>}
          <h3 className="text-xl font-bold text-purple-900">{title}</h3>
          <p className="text-gray-700 text-sm">{description}</p>
        </div>
      </div>
    </Link>
  );
}
