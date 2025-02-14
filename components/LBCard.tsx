"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface CardProps {
  header: string;
  subHeader: string;
  description: string;
  className: string;
  href: string;
}

const LBCard: React.FC<CardProps> = ({
  header,
  subHeader,
  description,
  className,
  href,
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <div
      className={`relative h-64 w-full rounded-lg shadow-md cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex flex-col justify-center items-center text-white p-4">
        <h2 className="text-2xl font-bold mb-2">{header}</h2>
        <h3 className="text-xl mb-2">{subHeader}</h3>
        <p className="text-center">{description}</p>
      </div>
    </div>
  );
};

export default LBCard;
