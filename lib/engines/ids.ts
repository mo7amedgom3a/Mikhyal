/** Id helpers shared by client code (kept free of heavy imports). */
export const conceptKey = (id: string) => id.replace(/^cpt_/, "");
export const slugOf = (id: string) => id.replace(/^[a-z]{3}_/, "");
