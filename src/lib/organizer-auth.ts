import {cookies} from "next/headers";
import {createHmac,timingSafeEqual} from "node:crypto";
export async function isOrganizerAuthenticated(){const token=(await cookies()).get("mmsu-organizer")?.value;const secret=process.env.ORGANIZER_SESSION_SECRET;if(!token||!secret)return false;const [expires,sig]=token.split(".");if(!expires||!sig||Number(expires)<Date.now())return false;const expected=createHmac("sha256",secret).update(expires).digest("hex");try{return timingSafeEqual(Buffer.from(sig),Buffer.from(expected))}catch{return false}}
