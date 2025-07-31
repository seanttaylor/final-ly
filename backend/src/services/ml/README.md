## Overview

`MLService` manages the data preparation lifecycle for training a machine learning model that categorizes feed items. It acts as the bridge between incoming raw feeds and the trained model by performing:

* Scheduled Data Pull & Preprocessing

    * At fixed intervals, pulls new feed items from /training/raw/feeds.

    * Applies a preprocessing pipeline:

    * HTML stripping

    * Text summarization (by sentence or word)

    * Lowercasing

    * Transformation into `{ text, label: null }` objects

    * Saves the results to a local file data sink at `/training/label_required/feeds`.

* Scheduled Label Validation

    * Validates that all feed items in `/training/label_required` have non-null labels.

    * Emits an event indicating the labeled data is ready for model training/upload.


### 💡 Current.ly in Context
`MLService` forms the core of the feed categorization feature in Current.ly. It:

Powers the backend intelligence needed to sort stories into topics like us_news, technology, etc.

Enables continuous improvement: as more labeled data is added, the model can be retrained iteratively.

Emits structured events that can trigger downstream workflows (like pushing training data to object storage or retraining the model).

>When the labeled data is successfully validated, the training data is pushed to object storage where that data can be input into a model training tool.

### ⚠️ Cautionary Notes
If `label_required` data is not correctly validated (e.g. missing labels), training cannot proceed and the pipeline halts.

Preprocessing assumes that the HTML content is always present and that summaries will contain meaningful signals—future refinements may involve semantic analysis or stopword filtering.