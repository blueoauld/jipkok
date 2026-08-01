import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const MY_PROFILE_KEY = ["members", "me"];

export function useMyProfile() {
  return useQuery({
    queryKey: MY_PROFILE_KEY,
    queryFn: api.members.myProfile,
  });
}
