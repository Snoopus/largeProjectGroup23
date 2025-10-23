//const url = "lp.ilovenarwhals.xyz";

export default function buildPath(route: string): string {
    if (import.meta.env.MODE !== "development") 
    {
        return "/api/" + route;
    }
    else
    {
        return "http://localhost:5000/" + route;
    }
}