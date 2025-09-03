export interface Ingredient {
    amount?: string;
    name: string;
}

export interface IngredientGroup {
    group?: string;
    items: Ingredient[];
}

export interface Review {
    username: string;
    score?: number;
    comment?: string;
}

export interface ExtFile {
    fileUrl: string;
    fileBase64?: string;
    fileFulltext?: string;
}

export interface NewRecipe {
    name: string;
    ingredients?: IngredientGroup[];
    steps?: string[];
    tags?: string[];
    links?: string[];
    files?: ExtFile[];
    thumbnail?: string;
    reviews?: Review[];
}

export interface Recipe extends NewRecipe {
    id: string;
}
