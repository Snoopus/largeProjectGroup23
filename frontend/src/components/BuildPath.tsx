//const url = "lp.ilovenarwhals.xyz";

export default function buildPath(route: string): string {
    if (import.meta.env.MODE !== "development") {
        // In production, let Nginx proxy handle /api requests over HTTPS
        return "/" + route;
    } else {
        // Local dev still talks directly to backend
        return "http://localhost:5000/" + route;
    }
}
