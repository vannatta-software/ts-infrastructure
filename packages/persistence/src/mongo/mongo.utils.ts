export enum SimilarityScaling {
    LINEAR = 'linear',
    QUADRATIC = 'quadratic',
    CUBIC = 'cubic',
    EXPONENTIAL = 'exponential'
}

type MongoType = number | object | string

export class MongoUtils {
    public static dotProduct(vector: number[]) {
       return {
            $sum: {
                $map: {
                    input: { $range: [0, vector.length] },
                    as: "idx",
                    in: {
                        $multiply: [
                            { $arrayElemAt: ["$vector", "$$idx"] },
                            { $arrayElemAt: [vector, "$$idx"] },
                        ],
                    },
                },
            },
        }
    }

    public static magnitude(length: number, vector?: number[]) {
        return {
            $sqrt: {
                $sum: {
                    $map: {
                        input: { $range: [0, length] },
                        as: "idx",
                        in: {
                            $pow: [
                                { $arrayElemAt: [ vector ?? "$vector", "$$idx"] },
                                2,
                            ],
                        },
                    },
                },
            },
        }
    }

    public static linearScaling(normalized: MongoType) {
        return normalized;
    }

    public static quadraticScaling(normalized: MongoType) {
        return {
            $multiply: [normalized, normalized]
        };
    }

    public static cubicScaling(normalized: MongoType) {
        return {
            $multiply: [normalized, normalized, normalized]
        };
    }

    public static exponentialScaling(normalized: MongoType) {
        return {
            $divide: [
                {
                    $subtract: [
                        { $exp: { $multiply: [normalized, 4] } },
                        1
                    ]
                },
                { $subtract: [Math.exp(4), 1] }  // Pre-calculated constant
            ]
        };
    }

    public static min(value: MongoType, ...values: (MongoType)[]) {
        return {
            $min: [value, ...values]
        };
    }

    public static max(value: MongoType, ...values: (MongoType)[]) {
        return {
            $max: [value, ...values]
        };
    }

    public static subtract(value1: MongoType, value2: MongoType) {
        return {
            $subtract: [value1, value2]
        };
    }

    public static divide(value1: MongoType, value2: MongoType) {
        return {
            $divide: [value1, value2]
        };
    }

    public static add(value1: MongoType, value2: MongoType) {
        return {
            $add: [value1, value2]
        };
    }

    public static gt(value1: MongoType, value2: MongoType) {
        return {
            $gt: [value1, value2]
        };
    }

    public static cond(condition: object, thenValue: any, elseValue: any) {
        return {
            $cond: {
                if: condition,
                then: thenValue,
                else: elseValue
            }
        };
    }

    public static vectorSimilarity(vector: number[]) {
        return {
            $let: {
                vars: {
                    dotProduct: this.dotProduct(vector)
                },
                in: this.min(1, this.max(0,
                    this.divide(
                        this.subtract("$$dotProduct", 0.7),
                        0.2
                    )
                ))
            }
        };
    }

    public static scaleValue(scaling: SimilarityScaling) {
        return {
            $switch: {
                branches: [
                    {
                        case: { $eq: [scaling, SimilarityScaling.QUADRATIC] },
                        then: this.cond(
                            this.gt("$similarity", 0.5),
                            this.add("$similarity", 0.1),
                            this.subtract("$similarity", 0.1)
                        )
                    },
                    {
                        case: { $eq: [scaling, SimilarityScaling.CUBIC] },
                        then: this.cond(
                            this.gt("$similarity", 0.5),
                            this.add("$similarity", 0.2),
                            this.subtract("$similarity", 0.2)
                        )
                    },
                    {
                        case: { $eq: [scaling, SimilarityScaling.EXPONENTIAL] },
                        then: this.cond(
                            this.gt("$similarity", 0.5),
                            this.add("$similarity", 0.3),
                            this.subtract("$similarity", 0.3)
                        )
                    }
                ],
                default: "$similarity"
            }
        }
    }

    public static gte(value1: MongoType, value2: MongoType) {
        return {
            $gte: [value1, value2]
        };
    }
}

export class MongoPipeline<T> {
    private stages: any[] = [];

    constructor() {}

    match(criteria: Partial<any>): this {
        this.stages.push({
            $match: criteria
        });
        return this;
    }

    sort(criteria: Partial<Record<keyof T, 1 | -1>>): this {
        this.stages.push({
            $sort: criteria
        });
        return this;
    }

    limit(count: number): this {
        this.stages.push({
            $limit: count
        });
        return this;
    }

    addFields(fields: Record<string, any>): this {
        this.stages.push({
            $addFields: fields
        });
        return this;
    }

    custom(stage: any): this {
        this.stages.push(stage);
        return this;
    }

    build(): any[] {
        return this.stages;
    }
}
