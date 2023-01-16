Rails.application.routes.draw do
  resources :recurring_transactions, only: [:create, :update, :index, :destroy]
  resources :scheduled_transactions, only: [:index]

  post :setup, to: 'test#setup'
  post :teardown, to: 'test#teardown'
end
