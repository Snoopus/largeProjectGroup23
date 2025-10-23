export function buildPath(route: string): string {
    const app_name = 'lp.ilovenarwhals.xyz';
    
    if (import.meta.env.MODE !== 'development') {
        return 'https://' + app_name + '/' + route;
    } else {
        return 'http://localhost:5000/' + route;
    }
}