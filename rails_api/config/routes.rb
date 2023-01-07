Rails.application.routes.draw do
  resources :recurring_transactions, only: [:create, :update, :index, :destroy]
  resources :scheduled_transactions, only: [:index]

  post :setup, to: 'test#setup'
  post :teardown, to: 'test#teardown'

  get '/404', to: 'errors#not_found'
end
