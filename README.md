# Functional Correctness via Model-based Testing

This is an experiment with using model-based testing as the primary testing method on an application. The actual application is a simple one for tracking recurring bills with different recurrence rules (think monthly, biweekly, etc.).

A specific type of model-based testing is used here, where a reference model is built in the same language as the client-side state manager. Some design choices are made to make this simpler, such as using MobX to make that state manager observable and have state changes automatically rendered in the UI.

# The Model

The model can be found in `personalfinance.ts`. This is a high-level, single-process, and in-memory description of the desired behavior of the application using only TypeScript.

# The Implementation

The implementation is a React application that communicates with a Rails API. The React app lives in `react_ui` and the Rails API lives in `rails_api`.

# The Model-Based Test

The functional correctness test compares the behavior of the implementation to the simpler model, and lives in `funcorrect.ts`. It does this by using the `fast-check` property-based testing library to simulate sequences of user actions, and asserts that the state of the implementation always matches the state of the model.

# Setup

```
brew install chruby
brew install ruby-install
brew install sqlite
ruby-install 3.1.6
```

Add this to shell rc (e.g. .zshrc, .bashrc, etc):

```
source /opt/homebrew/opt/chruby/share/chruby/chruby.sh
```

Start DB:

```
docker run --name pg_personal_finance -e POSTGRES_USER=personal_finance -e POSTGRES_PASSWORD=funcorrect -e POSTGRES_DB=db/personal_finance -p 5433:5432 -d postgres
```

cd into root dir of this repo.


```
chruby 3.1.6

cd rails_api
bundle config build.nio4r --with-cflags="-Wno-incompatible-pointer-types"
bundle install
rails db:setup
```

# Running

Start the web server:

```
chruby 3.1.6
cd rails_api
rails s
```

In a new terminal tab, start the frontend:

```
cd react_ui
npm start
```

# Testing

Start the web server in the test environment:

```
cd rails_api
RAILS_ENV=test rails s
```

Run the model-based test command:

```
./test
```

There are also some specific test cases that can be run with:

```
./testexamples
```
