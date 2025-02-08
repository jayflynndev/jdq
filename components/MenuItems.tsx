import { useRouter } from "next/navigation";

interface MenuItemsProps {
  title: string;
  href: string;
  onClick?: () => void;
}

export default function MenuItems({ title, href, onClick }: MenuItemsProps) {
  const router = useRouter();

  const handleClick = async () => {
    if (onClick) {
      await onClick();
    }
    router.push(href);
  };

  return (
    <div
      className="relative flex h-full items-center p-4 cursor-pointer font-bold text-white text-2xl hover:text-purple-400"
      onClick={handleClick}
    >
      <span>{title}</span>
    </div>
  );
}
