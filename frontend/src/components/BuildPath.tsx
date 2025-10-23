const url = "lp.ilovenarwhals.xyz";

export default function buildPath(route: string): string {
    if (import.meta.env.MODE !== "development") 
    {
        return "http://" + url + ":5000/" + route;
    }
    else
    {
        return "http://localhost:5000/" + route;
    }
}