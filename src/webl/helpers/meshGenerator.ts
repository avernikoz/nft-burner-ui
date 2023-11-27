export class GMeshGenerator {
    static GeneratePolyboardVertical(subdivisionsY: number): { vertices: number[]; texCoords: number[] } {
        const vertices: number[] = [];
        const texCoords: number[] = [];

        // Iterate through subdivisions in the y-axis
        for (let y = 1; y <= subdivisionsY; y++) {
            const v1 = (y - 1) / subdivisionsY; // Starting v-coordinate for the row
            const v2 = y / subdivisionsY; // Ending v-coordinate for the row

            // First triangle of the first square
            vertices.push(-1, v1 - 0.5); // x, y
            vertices.push(0, v1 - 0.5); // x, y
            vertices.push(-1, v2 - 0.5); // x, y

            texCoords.push(0, v1);
            texCoords.push(0.5, v1);
            texCoords.push(0, v2);

            // Second triangle of the first square
            vertices.push(0, v1 - 0.5); // x, y
            vertices.push(0, v2 - 0.5); // x, y
            vertices.push(-1, v2 - 0.5); // x, y

            texCoords.push(0.5, v1);
            texCoords.push(0.5, v2);
            texCoords.push(0, v2);

            // First triangle of the second square
            vertices.push(0, v1 - 0.5); // x, y
            vertices.push(1, v1 - 0.5); // x, y
            vertices.push(1, v2 - 0.5); // x, y

            texCoords.push(0.5, v1);
            texCoords.push(1, v1);
            texCoords.push(1, v2);

            // Second triangle of the second square
            vertices.push(0, v1 - 0.5); // x, y
            vertices.push(1, v2 - 0.5); // x, y
            vertices.push(0, v2 - 0.5); // x, y

            texCoords.push(0.5, v1);
            texCoords.push(1, v2);
            texCoords.push(0.5, v2);
        }

        return { vertices, texCoords };
    }
}
