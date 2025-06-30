import { getFirestore, collection, getDocs } from "firebase/firestore";
import { calculateAverages } from "@/utils/calculateAverages";

interface Score {
  quizDate: string;
  score: number;
  tiebreaker: number;
}

interface User {
  uid: string;
  scores: Score[];
}

interface UserWithAverages {
  uid: string;
  weeklyAverage: number;
  monthlyAverage: number;
  allTimeAverage: number;
  tiebreaker: number;
}

export async function calculateUserPosition(uid: string): Promise<{
  weeklyPosition: number;
  monthlyPosition: number;
  allTimePosition: number;
}> {
  const db = getFirestore();
  const usersCollection = collection(db, "users");
  const usersSnapshot = await getDocs(usersCollection);
  const users: User[] = [];

  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      uid: doc.id,
      scores: data.scores || [],
    });
  });

  const usersWithAverages: UserWithAverages[] = users.map((user) => {
    const averages = calculateAverages(user.scores);
    return {
      uid: user.uid,
      weeklyAverage: averages.weeklyAverage,
      monthlyAverage: averages.monthlyAverage,
      allTimeAverage: averages.allTimeAverage,
      tiebreaker:
        user.scores.reduce((acc, score) => acc + score.tiebreaker, 0) /
        user.scores.length,
    };
  });

  const sortUsers = (
    users: UserWithAverages[],
    key: "weeklyAverage" | "monthlyAverage" | "allTimeAverage"
  ) => {
    return users.sort((a, b) => {
      if (b[key] !== a[key]) {
        return b[key] - a[key];
      }
      return a.tiebreaker - b.tiebreaker;
    });
  };

  const weeklySortedUsers = sortUsers([...usersWithAverages], "weeklyAverage");
  const monthlySortedUsers = sortUsers(
    [...usersWithAverages],
    "monthlyAverage"
  );
  const allTimeSortedUsers = sortUsers(
    [...usersWithAverages],
    "allTimeAverage"
  );

  const findPosition = (sortedUsers: UserWithAverages[], uid: string) => {
    return sortedUsers.findIndex((user) => user.uid === uid) + 1;
  };

  return {
    weeklyPosition: findPosition(weeklySortedUsers, uid),
    monthlyPosition: findPosition(monthlySortedUsers, uid),
    allTimePosition: findPosition(allTimeSortedUsers, uid),
  };
}
