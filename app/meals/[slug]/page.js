export default function MealsPostPage({ params }) {
	return (
		<main>
			<h1>Meal Post</h1>
			<p>{params.slug}</p>
		</main>
	);
}
