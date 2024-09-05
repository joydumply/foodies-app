import fs from 'node:fs'; // allow to work with filesystem

import sql from 'better-sqlite3';
import slugify from 'slugify'; // making slug from string
import xss from 'xss'; // cross-site scripting defense

const db = sql('meals.db');

export async function getMeals() {
	await new Promise((resolve) => setTimeout(resolve, 50));
	return db.prepare('SELECT * FROM meals').all();
}

export function getMeal(slug) {
	return db.prepare('SELECT * FROM meals WHERE slug = ?').get(slug);
}

export async function saveMeal(meal) {
	meal.slug = slugify(meal.title, { lower: true });
	meal.instructions = xss(meal.instructions);

	const extension = meal.image.name.split('.').pop();
	const fileName = `${meal.slug}.${extension}`;

	const stream = fs.createWriteStream(`public/images/${fileName}`);
	const bufferedImage = await meal.image.arrayBuffer();

	stream.write(Buffer.from(bufferedImage), (error) => {
		if (error) {
			throw new Error('Saving image failed!');
		}
	});

	// Этот код записывает изображение (или другой файл) на диск, используя поток записи (createWriteStream) и буфер данных. Давай разберём его по шагам:

	// const stream = fs.createWriteStream(public/images/${fileName});:

	// Это создаёт поток записи, используя модуль fs (модуль работы с файловой системой в Node.js).
	// fs.createWriteStream() создаёт поток, который будет записывать данные в файл, расположенный по пути public/images/${fileName}, где fileName — это имя файла.
	// Этот поток позволяет записывать данные постепенно, что полезно при работе с большими файлами.
	// const bufferedImage = await meal.image.arrayBuffer();:

	// Здесь предполагается, что meal.image — это объект изображения (например, из запроса или загруженного файла).
	// Метод arrayBuffer() преобразует изображение в бинарный буфер, представляющий данные в виде массива байтов.
	// Ожидание (await) используется, потому что arrayBuffer() возвращает промис, который разрешается, когда преобразование данных завершено.
	// stream.write(Buffer.from(bufferedImage));:

	// Функция Buffer.from(bufferedImage) преобразует бинарные данные (буферное изображение) в объект типа Buffer, который является удобным форматом для работы с бинарными данными в Node.js.
	// stream.write() записывает эти данные в поток, который ведёт к файлу на диске.
	// В итоге:
	// Этот код берёт изображение, преобразует его в буфер и записывает на диск по указанному пути (public/images/${fileName}).

	// Этот подход полезен для загрузки и сохранения файлов на сервере.

	meal.image = `/images/${fileName}`;

	db.prepare(
		`
		INSERT INTO meals
		(title, summary, instructions, creator, creator_email, image, slug)
		VALUES (
			@title,
			@summary,
			@instructions,
			@creator,
			@creator_email,
			@image,
			@slug
		)	
	`
	).run(meal);

	// @title этот тип записи используется в sqlite
	// нужно чтоб в объекте переменные назывались так же
	// и соблюдался порядок в INSERT INTO
}
