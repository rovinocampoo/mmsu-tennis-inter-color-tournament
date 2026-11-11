import {NextResponse} from "next/server";
export async function POST(req:Request){const res=NextResponse.redirect(new URL("/organizer",req.url));res.cookies.set("mmsu-organizer","",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});return res;}
