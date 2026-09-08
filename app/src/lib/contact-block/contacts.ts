import { getPermissionsAsync, requestPermissionsAsync } from "expo-contacts";
import { Fields, getContactsAsync } from "expo-contacts/legacy";

import { normalizeContactNumbers } from "@/lib/contact-block/phone";
import { currentCountry } from "@/lib/phone/store";

export async function hasContactsPermission() {
  return (await getPermissionsAsync()).granted;
}

export async function requestContactsPermission() {
  return (await requestPermissionsAsync()).granted;
}

// 이름은 읽지 않는다. 서버에 보내는 것도 번호뿐이다.
export async function readContactNumbers() {
  const { data } = await getContactsAsync({ fields: [Fields.PhoneNumbers] });
  const raws = data.flatMap(
    (contact) =>
      contact.phoneNumbers?.flatMap((phone) =>
        phone.number ? [phone.number] : [],
      ) ?? [],
  );

  return normalizeContactNumbers(raws, currentCountry());
}
