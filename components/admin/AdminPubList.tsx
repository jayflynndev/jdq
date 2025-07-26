"use client";
import React from "react";

type Member = {
  username: string;
};

type Pub = {
  id: string | number;
  name: string;
  members?: Member[];
};

type AdminPubListProps = {
  pubs: Pub[];
};

export const AdminPubList: React.FC<AdminPubListProps> = ({ pubs }) => (
  <div className="bg-white rounded-xl p-6 shadow mb-0 flex-1">
    <h3 className="text-lg font-bold mb-2 text-purple-700">Pubs</h3>
    {pubs.length === 0 ? (
      <div className="text-gray-400">No pubs added yet.</div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pubs.map((pub) => (
          <div key={pub.id} className="border rounded-xl p-4 bg-purple-50">
            <div className="font-bold text-purple-800">{pub.name}</div>
            <div className="text-sm text-gray-500 mb-2">
              {(pub.members || []).length} members
            </div>
            <ul className="text-sm">
              {(pub.members || []).map((m, idx) => (
                <li key={idx}>{m.username}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}
  </div>
);
