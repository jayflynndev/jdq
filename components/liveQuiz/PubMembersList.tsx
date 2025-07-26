import React from "react";

interface PubMembersListProps {
  members: string[];
  currentUser: string;
  pubName: string;
}

export const PubMembersList: React.FC<PubMembersListProps> = ({
  members,
  currentUser,
  pubName,
}) => (
  <div className="mb-4">
    <div className="font-semibold text-purple-700 mb-1">
      Players in {pubName}:
    </div>
    <div className="flex flex-wrap gap-3">
      {members.map((name) => (
        <span
          key={name}
          className={`px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 font-medium text-sm
            ${
              name === currentUser
                ? "bg-yellow-100 border-yellow-300 font-bold"
                : ""
            }
          `}
        >
          {name}
        </span>
      ))}
    </div>
  </div>
);
