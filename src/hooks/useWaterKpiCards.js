import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { planReorder, sortKpiCards } from '../helpers/waterKpiCards';
import { waterKpiCardsApi } from '../helpers/waterKpiCardsApi';

// Logout clears the whole query cache, so one admin's cards are never served
// to the next login and the key doesn't need to carry the user.
export const WATER_KPI_CARDS_QUERY_KEY = ['water', 'kpi-cards'];

export function useWaterKpiCards() {
	const queryClient = useQueryClient();

	const cardsQuery = useQuery({
		queryKey: WATER_KPI_CARDS_QUERY_KEY,
		queryFn: ({ signal }) => waterKpiCardsApi.list({ signal }),
		select: sortKpiCards,
		staleTime: 30 * 1000,
	});

	// Every mutation ends with a refetch, so the list always settles on what
	// the server actually stored, including after a partial failure.
	const refetchCards = () =>
		queryClient.invalidateQueries({ queryKey: WATER_KPI_CARDS_QUERY_KEY });

	const createCard = useMutation({
		mutationFn: (body) => waterKpiCardsApi.create(body),
		onSettled: refetchCards,
	});

	const updateCard = useMutation({
		mutationFn: ({ id, changes }) => waterKpiCardsApi.update(id, changes),
		onSuccess: (savedCard) => {
			if (savedCard?.id === undefined) {
				return;
			}
			queryClient.setQueryData(WATER_KPI_CARDS_QUERY_KEY, (cards = []) =>
				cards.map((card) => (card.id === savedCard.id ? savedCard : card))
			);
		},
		onSettled: refetchCards,
	});

	const deleteCard = useMutation({
		mutationFn: (id) => waterKpiCardsApi.remove(id),
		onSettled: refetchCards,
	});

	// Shows the new order immediately, then PATCHes display_order for only the
	// cards whose position changed. On failure it rolls back to the order
	// before the move, and the refetch shows whatever the server kept.
	const reorderCards = useMutation({
		mutationFn: (orderedCards) =>
			Promise.all(
				planReorder(orderedCards).map(({ id, display_order }) =>
					waterKpiCardsApi.update(id, { display_order })
				)
			),
		onMutate: async (orderedCards) => {
			await queryClient.cancelQueries({ queryKey: WATER_KPI_CARDS_QUERY_KEY });
			const previousCards = queryClient.getQueryData(WATER_KPI_CARDS_QUERY_KEY);
			queryClient.setQueryData(
				WATER_KPI_CARDS_QUERY_KEY,
				orderedCards.map((card, index) => ({
					...card,
					display_order: index + 1,
				}))
			);
			return { previousCards };
		},
		onError: (_error, _orderedCards, context) => {
			if (context?.previousCards) {
				queryClient.setQueryData(
					WATER_KPI_CARDS_QUERY_KEY,
					context.previousCards
				);
			}
		},
		onSettled: refetchCards,
	});

	return {
		cards: cardsQuery.data || [],
		isLoading: cardsQuery.isLoading,
		isFetching: cardsQuery.isFetching,
		error: cardsQuery.error,
		refetch: cardsQuery.refetch,
		createCard,
		updateCard,
		deleteCard,
		reorderCards,
	};
}
