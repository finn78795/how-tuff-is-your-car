export function aiNotConnected(feature: string) {
  return Response.json(
    {
      status: "placeholder",
      feature,
      message: `${feature} is scaffolded but no AI model is connected yet. Replace this route with your provider call.`,
    },
    { status: 501 },
  );
}
